import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, User, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CabecalhoPagina,
  EtiquetaStatusVenda,
} from "@/components/painel/ui-painel";
import { BotaoExcluir } from "@/components/painel/botao-excluir";
import { buscarVenda, exigirSessao } from "@/lib/consultas/painel";
import {
  atualizarStatusVenda,
  cancelarVenda,
  excluirVenda,
} from "@/lib/acoes/vendas";
import { formatarData, formatarDataHora, formatarMoeda } from "@/lib/formatar";
import { FORMA_PAGAMENTO } from "@/lib/constantes";

export default async function PaginaVenda({
  params,
}: PageProps<"/admin/vendas/[id]">) {
  const sessao = await exigirSessao();

  const { id } = await params;
  const venda = await buscarVenda(id);

  // Nao existe, ou existe mas o RLS nao deixou este usuario ver: para quem
  // esta na tela, o resultado e o mesmo.
  if (!venda) notFound();

  const cancelada = venda.status === "cancelado";

  return (
    <>
      <Button
        render={<Link href="/admin/vendas" />}
        variant="ghost"
        size="sm"
        className="-ml-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar
      </Button>

      <CabecalhoPagina
        titulo={`Venda de ${formatarData(venda.data)}`}
        descricao={`Registrada em ${formatarDataHora(venda.criado_em)}.`}
      >
        <EtiquetaStatusVenda status={venda.status} />

        {!cancelada && (
          <>
            {/* Trocar entre pago e pendente nao mexe em estoque. */}
            <form action={atualizarStatusVenda}>
              <input type="hidden" name="id" value={venda.id} />
              <input
                type="hidden"
                name="status"
                value={venda.status === "pago" ? "pendente" : "pago"}
              />
              <Button type="submit" variant="outline" size="sm">
                {venda.status === "pago"
                  ? "Marcar como pendente"
                  : "Marcar como pago"}
              </Button>
            </form>

            <BotaoExcluir
              acao={cancelarVenda}
              id={venda.id}
              rotulo="Cancelar venda"
              variante="outline"
              pergunta="Cancelar esta venda? Os equipamentos voltam para o estoque e o registro continua no historico."
            />
          </>
        )}

        {sessao.ehAdmin && (
          <BotaoExcluir
            acao={excluirVenda}
            id={venda.id}
            rotulo="Excluir"
            pergunta="Excluir a venda definitivamente? Ela some do historico e dos relatorios. Cancelar costuma ser a opcao certa."
          />
        )}
      </CabecalhoPagina>

      {cancelada && (
        <p className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-100 p-3 text-sm text-neutral-700">
          <Ban className="size-4" aria-hidden="true" />
          Venda cancelada. Os equipamentos ja foram devolvidos ao estoque e ela
          nao entra nos totais do painel.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="bg-card overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Valor unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {venda.venda_itens.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className="font-medium">
                      {item.produtos?.nome ?? "Equipamento removido"}
                    </span>
                    {item.produtos?.modelo && (
                      <span className="text-muted-foreground block text-xs">
                        {item.produtos.modelo}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.quantidade}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatarMoeda(Number(item.valor_unitario))}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatarMoeda(Number(item.subtotal))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="border-t p-4">
            <dl className="ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatarMoeda(Number(venda.subtotal))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Desconto</dt>
                <dd>- {formatarMoeda(Number(venda.desconto))}</dd>
              </div>
              <div className="flex justify-between border-t pt-1 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatarMoeda(Number(venda.total))}</dd>
              </div>
            </dl>
          </div>
        </section>

        <aside className="bg-card h-fit space-y-4 rounded-xl border p-4">
          <div>
            <p className="text-muted-foreground text-xs">Cliente</p>
            {venda.clientes ? (
              <Link
                href={`/admin/clientes/${venda.clientes.id}`}
                className="flex items-center gap-1.5 font-medium hover:underline"
              >
                <User className="size-3.5" aria-hidden="true" />
                {venda.clientes.nome}
              </Link>
            ) : (
              <p className="font-medium">—</p>
            )}
            {venda.clientes?.cidade && (
              <p className="text-muted-foreground text-xs">
                {venda.clientes.cidade}
              </p>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-muted-foreground text-xs">Vendedor</p>
            <p className="flex items-center gap-1.5 font-medium">
              <UserCog className="size-3.5" aria-hidden="true" />
              {venda.vendedores?.nome ?? "—"}
            </p>
          </div>

          <Separator />

          <div>
            <p className="text-muted-foreground text-xs">Pagamento</p>
            <p className="font-medium">
              {FORMA_PAGAMENTO[venda.forma_pagamento]}
            </p>
          </div>

          {venda.pedido_id && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs">Origem</p>
                <Link
                  href={`/admin/pedidos/${venda.pedido_id}`}
                  className="text-primary text-sm hover:underline"
                >
                  Veio de um pedido do site
                </Link>
              </div>
            </>
          )}

          {venda.observacoes && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs">Observacoes</p>
                <p className="text-sm whitespace-pre-line">
                  {venda.observacoes}
                </p>
              </div>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
