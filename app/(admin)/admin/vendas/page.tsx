import Link from "next/link";
import { Download, FileUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avisos,
  CabecalhoPagina,
  EtiquetaStatusVenda,
  Vazio,
} from "@/components/painel/ui-painel";
import { ImportarVendas } from "@/components/painel/importar-vendas";
import { CampoSelecao, CampoTexto } from "@/components/painel/campos";
import {
  exigirSessao,
  listarClientes,
  listarVendas,
  listarVendedores,
} from "@/lib/consultas/painel";
import { schemaFiltroVendas } from "@/lib/validacoes/venda";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import { FORMA_PAGAMENTO, OPCOES_STATUS_VENDA } from "@/lib/constantes";

export default async function PaginaVendas(props: PageProps<"/admin/vendas">) {
  const sessao = await exigirSessao();
  const searchParams = await props.searchParams;

  const texto = (chave: string) =>
    typeof searchParams[chave] === "string" && searchParams[chave] !== ""
      ? (searchParams[chave] as string)
      : undefined;

  // Filtro invalido (alguem mexeu na URL) nao quebra a tela: cai para vazio.
  const analise = schemaFiltroVendas.safeParse({
    de: texto("de"),
    ate: texto("ate"),
    cliente_id: texto("cliente_id"),
    vendedor_id: texto("vendedor_id"),
    status: texto("status"),
  });
  const filtro = analise.success ? analise.data : {};

  const [vendas, clientes, vendedores] = await Promise.all([
    listarVendas(filtro),
    listarClientes(),
    listarVendedores(),
  ]);

  const ativas = vendas.filter((v) => v.status !== "cancelado");
  const totalFiltrado = ativas.reduce((s, v) => s + Number(v.total ?? 0), 0);

  // Os mesmos filtros da tela vao para a exportacao, para o Excel sair
  // exatamente com o que esta a vista.
  const parametrosExportacao = new URLSearchParams(
    Object.entries(filtro).filter(([, v]) => v) as [string, string][],
  );

  return (
    <>
      <CabecalhoPagina
        titulo="Vendas"
        descricao={`${ativas.length} ${
          ativas.length === 1 ? "venda" : "vendas"
        } no filtro · ${formatarMoeda(totalFiltrado)}`}
      >
        <Button
          render={
            <a href={`/api/vendas/exportar?${parametrosExportacao}`} download />
          }
          variant="outline"
          size="sm"
        >
          <Download className="size-4" aria-hidden="true" />
          Exportar Excel
        </Button>

        <Button render={<Link href="/admin/vendas/nova" />} size="sm">
          <Plus className="size-4" aria-hidden="true" />
          Nova venda
        </Button>
      </CabecalhoPagina>

      <Avisos ok={searchParams.ok} erro={searchParams.erro} />

      {/* ------------------------------------------------------------- */}
      {/* Filtros                                                        */}
      {/* ------------------------------------------------------------- */}
      <form
        method="get"
        className="bg-card grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
      >
        <CampoTexto nome="de" rotulo="De" tipo="date" valor={filtro.de} />
        <CampoTexto nome="ate" rotulo="Ate" tipo="date" valor={filtro.ate} />

        <CampoSelecao
          nome="cliente_id"
          rotulo="Cliente"
          opcoes={clientes.map((c) => ({ valor: c.id, texto: c.nome }))}
          valor={filtro.cliente_id}
          vazio="Todos"
        />

        <CampoSelecao
          nome="vendedor_id"
          rotulo="Vendedor"
          opcoes={vendedores.map((v) => ({ valor: v.id, texto: v.nome }))}
          valor={filtro.vendedor_id}
          vazio="Todos"
        />

        <div className="flex gap-2">
          <div className="flex-1">
            <CampoSelecao
              nome="status"
              rotulo="Situacao"
              opcoes={OPCOES_STATUS_VENDA.map((o) => ({
                valor: o.valor,
                texto: o.texto,
              }))}
              valor={filtro.status}
              vazio="Todas"
            />
          </div>
        </div>

        <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
          <Button type="submit" size="sm">
            Filtrar
          </Button>
          <Button
            render={<Link href="/admin/vendas" />}
            variant="ghost"
            size="sm"
          >
            Limpar
          </Button>
        </div>
      </form>

      {/* ------------------------------------------------------------- */}
      {/* Listagem                                                       */}
      {/* ------------------------------------------------------------- */}
      {vendas.length === 0 ? (
        <Vazio
          titulo="Nenhuma venda encontrada."
          descricao="Registre a primeira venda ou ajuste os filtros acima."
          acao={{ href: "/admin/vendas/nova", texto: "Registrar venda" }}
        />
      ) : (
        <div className="bg-card overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Equipamentos</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Situacao</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {vendas.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="whitespace-nowrap">
                    <Link
                      href={`/admin/vendas/${v.id}`}
                      className="font-medium hover:underline"
                    >
                      {formatarData(v.data)}
                    </Link>
                  </TableCell>

                  <TableCell className="text-sm">
                    {v.clientes?.nome ?? "—"}
                  </TableCell>

                  <TableCell className="text-muted-foreground max-w-60 truncate text-xs">
                    {v.venda_itens
                      .map(
                        (i) =>
                          `${i.quantidade}x ${i.produtos?.nome ?? "Equipamento"}`,
                      )
                      .join(", ")}
                  </TableCell>

                  <TableCell className="text-sm">
                    {v.vendedores?.nome ?? "—"}
                  </TableCell>

                  <TableCell className="text-muted-foreground text-xs">
                    {FORMA_PAGAMENTO[v.forma_pagamento]}
                  </TableCell>

                  <TableCell>
                    <EtiquetaStatusVenda status={v.status} />
                  </TableCell>

                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {formatarMoeda(Number(v.total))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Importacao                                                     */}
      {/* ------------------------------------------------------------- */}
      {sessao.ehAdmin && (
        <details className="bg-card group rounded-xl border">
          <summary className="flex cursor-pointer items-center gap-2 p-4 font-medium select-none">
            <FileUp className="size-4" aria-hidden="true" />
            Importar vendas de uma planilha
          </summary>
          <div className="border-t p-4">
            <ImportarVendas />
          </div>
        </details>
      )}
    </>
  );
}
