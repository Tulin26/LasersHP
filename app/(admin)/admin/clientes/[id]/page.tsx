import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CabecalhoPagina,
  EtiquetaStatusVenda,
} from "@/components/painel/ui-painel";
import { FormularioCliente } from "@/components/painel/formulario-cliente";
import { BotaoExcluir } from "@/components/painel/botao-excluir";
import {
  buscarCliente,
  exigirSessao,
  listarVendasDoCliente,
} from "@/lib/consultas/painel";
import { excluirCliente } from "@/lib/acoes/clientes";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import { montarLinkWhatsApp } from "@/lib/whatsapp";

export default async function PaginaCliente({
  params,
}: PageProps<"/admin/clientes/[id]">) {
  const sessao = await exigirSessao();

  const { id } = await params;
  const cliente = await buscarCliente(id);

  if (!cliente) notFound();

  const vendas = await listarVendasDoCliente(cliente.id);

  // Vendas canceladas nao contam no total comprado.
  const totalComprado = vendas
    .filter((v) => v.status !== "cancelado")
    .reduce((soma, v) => soma + Number(v.total ?? 0), 0);

  return (
    <>
      <Button
        render={<Link href="/admin/clientes" />}
        variant="ghost"
        size="sm"
        className="-ml-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar
      </Button>

      <CabecalhoPagina
        titulo={cliente.nome}
        descricao={`Cliente desde ${formatarData(cliente.criado_em)}. Total comprado: ${formatarMoeda(totalComprado)}.`}
      >
        {cliente.telefone && (
          <Button
            render={
              <a
                href={montarLinkWhatsApp(cliente.telefone)}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            variant="outline"
            size="sm"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            WhatsApp
          </Button>
        )}

        <Button
          render={<Link href={`/admin/vendas/nova?cliente=${cliente.id}`} />}
          size="sm"
        >
          <Receipt className="size-4" aria-hidden="true" />
          Nova venda
        </Button>

        {/* Excluir cliente e privilegio do admin (policy "admin gerencia clientes"). */}
        {sessao.ehAdmin && (
          <BotaoExcluir
            acao={excluirCliente}
            id={cliente.id}
            pergunta={`Excluir "${cliente.nome}"? Se houver venda ligada a ele, o banco vai recusar.`}
          />
        )}
      </CabecalhoPagina>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="min-w-0 bg-card rounded-xl border p-4">
          <h2 className="mb-4 font-semibold">Dados cadastrais</h2>
          <FormularioCliente cliente={cliente} />
        </section>

        <section className="min-w-0 bg-card h-fit rounded-xl border p-4">
          <h2 className="font-semibold">Historico de compras</h2>

          {vendas.length === 0 ? (
            <p className="text-muted-foreground mt-3 text-sm">
              Nenhuma compra registrada ainda.
            </p>
          ) : (
            <ul className="mt-3 divide-y">
              {vendas.map((v) => (
                <li key={v.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/admin/vendas/${v.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {formatarData(v.data)}
                    </Link>
                    <div className="flex items-center gap-2">
                      <EtiquetaStatusVenda status={v.status} />
                      <span className="text-sm font-semibold">
                        {formatarMoeda(Number(v.total))}
                      </span>
                    </div>
                  </div>

                  <p className="text-muted-foreground mt-1 text-xs">
                    {v.venda_itens
                      .map(
                        (i) =>
                          `${i.quantidade}x ${i.produtos?.nome ?? "Equipamento"}`,
                      )
                      .join(", ")}
                    {v.vendedores ? ` · ${v.vendedores.nome}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
