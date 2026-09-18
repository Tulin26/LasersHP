import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { buscarSessao, listarVendas } from "@/lib/consultas/painel";
import { schemaFiltroVendas } from "@/lib/validacoes/venda";
import { FORMA_PAGAMENTO, STATUS_VENDA } from "@/lib/constantes";
import { paraDataISO } from "@/lib/formatar";

/**
 * Exportacao de vendas para .xlsx.
 *
 * Por que Route Handler e nao Server Action: Server Action devolve dados
 * serializados para o React, nao um arquivo. Para o navegador baixar um
 * .xlsx e preciso responder com o binario e os cabecalhos certos
 * (Content-Type e Content-Disposition) — e isso so um Route Handler faz.
 *
 * Route Handler e o mais parecido com o que voce faria em PHP: um endpoint
 * que recebe a requisicao e devolve a resposta na mao.
 *
 * Sobre os limites do plano gratuito da Vercel: a funcao tem tempo e memoria
 * contados, e a planilha inteira e montada na memoria. Por isso existe o
 * LIMITE_LINHAS abaixo — melhor avisar para filtrar por periodo do que
 * estourar a funcao e o usuario ver um erro 500 sem explicacao.
 */

export const dynamic = "force-dynamic";

const LIMITE_LINHAS = 20000;

export async function GET(request: NextRequest) {
  // Mesmo sendo uma URL "escondida", ela e publica: qualquer um pode chamar.
  // Sem esta checagem, bastaria acertar o endereco para baixar o faturamento.
  const sessao = await buscarSessao();
  if (!sessao) {
    return NextResponse.json({ erro: "Nao autorizado." }, { status: 401 });
  }

  const parametros = Object.fromEntries(request.nextUrl.searchParams);

  const analise = schemaFiltroVendas.safeParse({
    de: parametros.de || undefined,
    ate: parametros.ate || undefined,
    cliente_id: parametros.cliente_id || undefined,
    vendedor_id: parametros.vendedor_id || undefined,
    status: parametros.status || undefined,
  });

  if (!analise.success) {
    return NextResponse.json({ erro: "Filtros invalidos." }, { status: 400 });
  }

  // O RLS decide o que este usuario enxerga: o admin exporta tudo, o vendedor
  // exporta apenas as proprias vendas. Nao existe `if` aqui para isso.
  const vendas = await listarVendas(analise.data);

  // Uma linha por item vendido. A coluna "Codigo" repete nas linhas da mesma
  // venda — e por ela que a importacao sabe reagrupar os itens.
  const linhas = vendas.flatMap((venda) =>
    venda.venda_itens.map((item) => ({
      Codigo: venda.id.slice(0, 8),
      Data: venda.data,
      Produto: item.produtos?.nome ?? "Equipamento removido",
      Modelo: item.produtos?.modelo ?? "",
      Quantidade: item.quantidade,
      "Valor unitario": Number(item.valor_unitario),
      "Valor total": Number(item.subtotal),
      Comprador: venda.clientes?.nome ?? "",
      Vendedor: venda.vendedores?.nome ?? "",
      "Forma de pagamento": FORMA_PAGAMENTO[venda.forma_pagamento],
      Status: STATUS_VENDA[venda.status].texto,
      "Desconto da venda": Number(venda.desconto),
      "Total da venda": Number(venda.total),
      Observacoes: venda.observacoes ?? "",
    })),
  );

  if (linhas.length > LIMITE_LINHAS) {
    return NextResponse.json(
      {
        erro: `A exportacao ficou com ${linhas.length} linhas, acima do limite de ${LIMITE_LINHAS}. Filtre por periodo e exporte em partes.`,
      },
      { status: 413 },
    );
  }

  const planilha = XLSX.utils.json_to_sheet(
    linhas.length > 0
      ? linhas
      : // Planilha vazia ainda precisa dos cabecalhos, senao a importacao
        // de volta nao teria como saber quais colunas existem.
        [
          {
            Codigo: "",
            Data: "",
            Produto: "",
            Modelo: "",
            Quantidade: "",
            "Valor unitario": "",
            "Valor total": "",
            Comprador: "",
            Vendedor: "",
            "Forma de pagamento": "",
            Status: "",
            "Desconto da venda": "",
            "Total da venda": "",
            Observacoes: "",
          },
        ],
  );

  // Larguras de coluna: sem isso tudo sai espremido e o primo precisa
  // arrastar coluna por coluna toda vez que abre o arquivo.
  planilha["!cols"] = [
    { wch: 10 }, // Codigo
    { wch: 12 }, // Data
    { wch: 32 }, // Produto
    { wch: 16 }, // Modelo
    { wch: 10 }, // Quantidade
    { wch: 14 }, // Valor unitario
    { wch: 14 }, // Valor total
    { wch: 26 }, // Comprador
    { wch: 20 }, // Vendedor
    { wch: 18 }, // Forma de pagamento
    { wch: 12 }, // Status
    { wch: 16 }, // Desconto
    { wch: 14 }, // Total
    { wch: 40 }, // Observacoes
  ];

  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, "Vendas");

  const buffer: Buffer = XLSX.write(livro, {
    type: "buffer",
    bookType: "xlsx",
  });

  const nomeArquivo = `vendas-${paraDataISO(new Date())}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // attachment = o navegador baixa em vez de tentar abrir.
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      "Cache-Control": "no-store",
    },
  });
}
