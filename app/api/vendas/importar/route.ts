import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { criarClienteServidor } from "@/utils/supabase/server";
import { buscarSessao } from "@/lib/consultas/painel";
import { traduzirErroDoBanco } from "@/lib/acoes/tipos";
import { FORMA_PAGAMENTO, STATUS_VENDA } from "@/lib/constantes";
import { paraDataISO } from "@/lib/formatar";
import type { FormaPagamento, StatusVenda } from "@/lib/tipos/database.types";

/**
 * Importacao de vendas a partir de um .xlsx.
 *
 * Le o MESMO formato que a exportacao gera. As colunas obrigatorias sao
 * Data, Produto, Quantidade, Valor total, Comprador, Vendedor e Status; as
 * demais sao opcionais.
 *
 * Duas decisoes que valem explicacao:
 *
 * 1. Cada linha e processada de forma independente. Uma linha com erro NAO
 *    derruba a importacao inteira — ela entra no relatorio de falhas e as
 *    outras seguem. Para uma planilha preenchida a mao, isso e muito melhor
 *    que "deu erro na linha 47, nada foi importado".
 *
 * 2. Por padrao a importacao NAO baixa estoque. A planilha costuma trazer
 *    vendas antigas, que ja sairam da prateleira meses atras; baixar de novo
 *    zeraria o estoque real. Quem quiser o contrario marca a opcao na tela.
 *
 * Sobre os limites da Vercel: o arquivo e lido inteiro na memoria e cada
 * venda e uma ida ao banco. Por isso existem LIMITE_ARQUIVO e LIMITE_LINHAS —
 * e melhor recusar na porta do que a funcao ser morta no meio e deixar
 * metade das vendas gravadas sem o usuario saber quais.
 */

export const dynamic = "force-dynamic";

const LIMITE_ARQUIVO = 5 * 1024 * 1024; // 5 MB
const LIMITE_LINHAS = 2000;

type LinhaPlanilha = Record<string, unknown>;

type Falha = { linha: number; motivo: string };

/** Le um valor aceitando variacoes de acento e caixa no cabecalho. */
function pegar(linha: LinhaPlanilha, ...nomes: string[]): unknown {
  const chaves = Object.keys(linha);

  for (const nome of nomes) {
    const alvo = normalizar(nome);
    const chave = chaves.find((c) => normalizar(c) === alvo);
    if (chave !== undefined && linha[chave] !== undefined) return linha[chave];
  }
  return undefined;
}

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function paraTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor).trim();
}

/** Aceita "1.500,50", "1500.50" e numero puro do Excel. */
function paraNumero(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;

  const texto = paraTexto(valor);
  if (!texto) return null;

  const limpo = texto
    .replace(/[R$\s]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "") // separador de milhar
    .replace(",", ".");

  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : null;
}

/** Aceita Date do Excel, "2026-03-14" e "14/03/2026". */
function paraData(valor: unknown): string | null {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return paraDataISO(valor);
  }

  const texto = paraTexto(valor);
  if (!texto) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;

  const brasileira = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brasileira) {
    const [, dia, mes, ano] = brasileira;
    return `${ano}-${mes}-${dia}`;
  }

  return null;
}

function paraStatus(valor: unknown): StatusVenda {
  const texto = normalizar(paraTexto(valor));

  for (const [chave, { texto: rotulo }] of Object.entries(STATUS_VENDA)) {
    if (texto === chave || texto === normalizar(rotulo)) {
      return chave as StatusVenda;
    }
  }
  return "pendente";
}

function paraFormaPagamento(valor: unknown): FormaPagamento {
  const texto = normalizar(paraTexto(valor));
  if (!texto) return "outro";

  for (const [chave, rotulo] of Object.entries(FORMA_PAGAMENTO)) {
    if (texto === chave || texto === normalizar(rotulo)) {
      return chave as FormaPagamento;
    }
  }
  return "outro";
}

export async function POST(request: NextRequest) {
  const sessao = await buscarSessao();
  if (!sessao) {
    return NextResponse.json({ erro: "Nao autorizado." }, { status: 401 });
  }

  const formulario = await request.formData();
  const arquivo = formulario.get("arquivo");
  const baixarEstoque = formulario.get("baixar_estoque") === "on";

  if (!(arquivo instanceof File)) {
    return NextResponse.json(
      { erro: "Escolha um arquivo .xlsx." },
      { status: 400 },
    );
  }

  if (arquivo.size > LIMITE_ARQUIVO) {
    return NextResponse.json(
      { erro: "O arquivo passa de 5 MB. Divida a planilha em partes." },
      { status: 413 },
    );
  }

  let linhas: LinhaPlanilha[];
  try {
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    // cellDates: true faz o SheetJS devolver Date em vez do numero de serie
    // do Excel (45000 e coisa parecida).
    const livro = XLSX.read(buffer, { type: "buffer", cellDates: true });

    const primeiraAba = livro.SheetNames[0];
    if (!primeiraAba) {
      return NextResponse.json(
        { erro: "A planilha nao tem nenhuma aba." },
        { status: 400 },
      );
    }

    linhas = XLSX.utils.sheet_to_json<LinhaPlanilha>(
      livro.Sheets[primeiraAba],
      {
        defval: "",
      },
    );
  } catch {
    return NextResponse.json(
      { erro: "Nao consegui ler o arquivo. Ele e mesmo um .xlsx?" },
      { status: 400 },
    );
  }

  if (linhas.length === 0) {
    return NextResponse.json(
      { erro: "A planilha esta vazia." },
      { status: 400 },
    );
  }

  if (linhas.length > LIMITE_LINHAS) {
    return NextResponse.json(
      {
        erro: `A planilha tem ${linhas.length} linhas, acima do limite de ${LIMITE_LINHAS}. Divida em partes.`,
      },
      { status: 413 },
    );
  }

  const supabase = await criarClienteServidor();

  // Carregamos os cadastros uma vez so e resolvemos os nomes em memoria.
  // A alternativa — consultar o banco a cada linha — seria centenas de idas
  // e vindas e estouraria o tempo da funcao.
  const [{ data: produtos }, { data: vendedores }, { data: clientes }] =
    await Promise.all([
      supabase.from("produtos").select("id, nome, modelo, preco"),
      supabase.from("vendedores").select("id, nome"),
      supabase.from("clientes").select("id, nome"),
    ]);

  if (!produtos || !vendedores || !clientes) {
    return NextResponse.json(
      {
        erro: "Nao consegui ler os cadastros. As tabelas do Supabase ja foram criadas?",
      },
      { status: 500 },
    );
  }

  const acharProduto = (nome: string) =>
    produtos.find((p) => normalizar(p.nome) === normalizar(nome)) ??
    produtos.find((p) =>
      normalizar(`${p.nome} ${p.modelo ?? ""}`).includes(normalizar(nome)),
    );

  const acharVendedor = (nome: string) =>
    vendedores.find((v) => normalizar(v.nome) === normalizar(nome));

  const mapaClientes = new Map(
    clientes.map((c) => [normalizar(c.nome), c.id] as const),
  );

  // ------------------------------------------------------------------
  // 1. Agrupa as linhas por venda
  // ------------------------------------------------------------------
  type ItemPendente = {
    linha: number;
    produto_id: string;
    quantidade: number;
    valor_unitario: number;
  };

  type VendaPendente = {
    linhas: number[];
    data: string;
    clienteNome: string;
    vendedorId: string;
    status: StatusVenda;
    forma: FormaPagamento;
    desconto: number;
    observacoes: string;
    itens: ItemPendente[];
  };

  const grupos = new Map<string, VendaPendente>();
  const falhas: Falha[] = [];

  linhas.forEach((linha, indice) => {
    // +2: a linha 1 da planilha e o cabecalho e o Excel conta a partir de 1.
    const numeroLinha = indice + 2;

    const data = paraData(pegar(linha, "Data"));
    if (!data) {
      falhas.push({ linha: numeroLinha, motivo: "Data invalida ou vazia." });
      return;
    }

    const nomeProduto = paraTexto(pegar(linha, "Produto", "Equipamento"));
    if (!nomeProduto) {
      falhas.push({ linha: numeroLinha, motivo: "Produto nao informado." });
      return;
    }

    const produto = acharProduto(nomeProduto);
    if (!produto) {
      falhas.push({
        linha: numeroLinha,
        motivo: `Produto "${nomeProduto}" nao existe no cadastro.`,
      });
      return;
    }

    const quantidade = paraNumero(pegar(linha, "Quantidade", "Qtd"));
    if (
      quantidade === null ||
      !Number.isInteger(quantidade) ||
      quantidade < 1
    ) {
      falhas.push({
        linha: numeroLinha,
        motivo: "Quantidade precisa ser um numero inteiro maior que zero.",
      });
      return;
    }

    const nomeComprador = paraTexto(pegar(linha, "Comprador", "Cliente"));
    if (!nomeComprador) {
      falhas.push({ linha: numeroLinha, motivo: "Comprador nao informado." });
      return;
    }

    const nomeVendedor = paraTexto(pegar(linha, "Vendedor"));
    const vendedor = acharVendedor(nomeVendedor);
    if (!vendedor) {
      falhas.push({
        linha: numeroLinha,
        motivo: nomeVendedor
          ? `Vendedor "${nomeVendedor}" nao existe no cadastro.`
          : "Vendedor nao informado.",
      });
      return;
    }

    // Valor unitario: usa a coluna propria se existir; senao divide o total
    // pela quantidade; em ultimo caso cai no preco de tabela do produto.
    const unitarioDireto = paraNumero(pegar(linha, "Valor unitario"));
    const totalLinha = paraNumero(pegar(linha, "Valor total", "Total"));

    let valorUnitario: number | null = unitarioDireto;
    if (valorUnitario === null && totalLinha !== null) {
      valorUnitario = totalLinha / quantidade;
    }
    if (valorUnitario === null) valorUnitario = Number(produto.preco ?? 0);

    if (valorUnitario < 0) {
      falhas.push({ linha: numeroLinha, motivo: "Valor negativo." });
      return;
    }

    const codigo = paraTexto(pegar(linha, "Codigo"));
    // Sem codigo, cada linha vira uma venda propria — a chave usa o numero
    // da linha para nunca colidir com outra.
    const chave = codigo || `linha-${numeroLinha}`;

    const existente = grupos.get(chave);

    if (existente) {
      existente.linhas.push(numeroLinha);
      existente.itens.push({
        linha: numeroLinha,
        produto_id: produto.id,
        quantidade,
        valor_unitario: valorUnitario,
      });
      return;
    }

    grupos.set(chave, {
      linhas: [numeroLinha],
      data,
      clienteNome: nomeComprador,
      vendedorId: vendedor.id,
      status: paraStatus(pegar(linha, "Status")),
      forma: paraFormaPagamento(
        pegar(linha, "Forma de pagamento", "Pagamento"),
      ),
      desconto: paraNumero(pegar(linha, "Desconto da venda", "Desconto")) ?? 0,
      observacoes: paraTexto(pegar(linha, "Observacoes", "Observacao")),
      itens: [
        {
          linha: numeroLinha,
          produto_id: produto.id,
          quantidade,
          valor_unitario: valorUnitario,
        },
      ],
    });
  });

  // ------------------------------------------------------------------
  // 2. Grava cada venda
  // ------------------------------------------------------------------
  let importadas = 0;
  let clientesCriados = 0;

  for (const venda of grupos.values()) {
    const chaveCliente = normalizar(venda.clienteNome);
    let clienteId = mapaClientes.get(chaveCliente);

    // Cliente que ainda nao existe e criado na hora — sem isso, importar uma
    // planilha antiga exigiria cadastrar dezenas de clientes a mao antes.
    if (!clienteId) {
      const { data: novo, error } = await supabase
        .from("clientes")
        .insert({
          nome: venda.clienteNome,
          observacoes: "Criado pela importacao de planilha.",
        })
        .select("id")
        .single();

      if (error || !novo) {
        falhas.push({
          linha: venda.linhas[0],
          motivo: `Nao consegui criar o cliente "${venda.clienteNome}": ${
            error ? traduzirErroDoBanco(error) : "erro desconhecido"
          }`,
        });
        continue;
      }

      clienteId = novo.id;
      mapaClientes.set(chaveCliente, clienteId);
      clientesCriados += 1;
    }

    const { error } = await supabase.rpc("registrar_venda", {
      p_cliente_id: clienteId,
      p_vendedor_id: venda.vendedorId,
      p_itens: venda.itens.map((i) => ({
        produto_id: i.produto_id,
        quantidade: i.quantidade,
        valor_unitario: i.valor_unitario,
      })),
      p_desconto: venda.desconto,
      p_forma_pagamento: venda.forma,
      p_status: venda.status === "cancelado" ? "pendente" : venda.status,
      p_data: venda.data,
      p_pedido_id: null,
      p_observacoes: venda.observacoes || null,
      p_baixar_estoque: baixarEstoque,
    });

    if (error) {
      falhas.push({
        linha: venda.linhas[0],
        motivo: traduzirErroDoBanco(error),
      });
      continue;
    }

    importadas += 1;
  }

  return NextResponse.json({
    ok: true,
    totalLinhas: linhas.length,
    importadas,
    clientesCriados,
    baixouEstoque: baixarEstoque,
    falhas: falhas.sort((a, b) => a.linha - b.linha),
  });
}
