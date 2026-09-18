import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CabecalhoPagina,
  EtiquetaStatusPedido,
} from "@/components/painel/ui-painel";
import { SeletorStatusPedido } from "@/components/painel/seletor-status-pedido";
import { ConverterPedido } from "@/components/painel/converter-pedido";
import { buscarPedido, exigirSessao } from "@/lib/consultas/painel";
import {
  formatarDataHora,
  formatarTelefone,
} from "@/lib/formatar";
import { montarLinkWhatsApp } from "@/lib/whatsapp";

export default async function PaginaPedido({
  params,
}: PageProps<"/admin/pedidos/[id]">) {
  await exigirSessao();

  const { id } = await params;
  const pedido = await buscarPedido(id);

  if (!pedido) notFound();

  const mensagemWhatsApp = `Ola ${pedido.nome}! Recebemos seu pedido${
    pedido.produtos ? ` do ${pedido.produtos.nome}` : ""
  } pelo site. Posso te ajudar?`;

  return (
    <>
      <Button
        render={<Link href="/admin/pedidos" />}
        variant="ghost"
        size="sm"
        className="-ml-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar
      </Button>

      <CabecalhoPagina
        titulo={pedido.nome}
        descricao={`Recebido em ${formatarDataHora(pedido.criado_em)}.`}
      >
        <EtiquetaStatusPedido status={pedido.status} />
      </CabecalhoPagina>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* ----------------------------------------------------------- */}
        <div className="space-y-6">
          <section className="bg-card rounded-xl border p-4">
            <h2 className="font-semibold">Contato</h2>

            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-xs">Telefone</dt>
                <dd className="flex items-center gap-1.5 text-sm">
                  <Phone className="size-3.5" aria-hidden="true" />
                  {formatarTelefone(pedido.telefone)}
                </dd>
              </div>

              {pedido.email && (
                <div>
                  <dt className="text-muted-foreground text-xs">E-mail</dt>
                  <dd className="flex items-center gap-1.5 text-sm">
                    <Mail className="size-3.5" aria-hidden="true" />
                    <a
                      href={`mailto:${pedido.email}`}
                      className="hover:underline"
                    >
                      {pedido.email}
                    </a>
                  </dd>
                </div>
              )}

              {pedido.cidade && (
                <div>
                  <dt className="text-muted-foreground text-xs">Cidade</dt>
                  <dd className="flex items-center gap-1.5 text-sm">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {pedido.cidade}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section className="bg-card rounded-xl border p-4">
            <h2 className="font-semibold">Equipamento de interesse</h2>

            {pedido.produtos ? (
              <div className="mt-3">
                <p className="font-medium">{pedido.produtos.nome}</p>
                {pedido.produtos.modelo && (
                  <p className="text-muted-foreground text-sm">
                    Modelo {pedido.produtos.modelo}
                  </p>
                )}
                <Button
                  render={
                    <Link
                      href={`/equipamentos/${pedido.produtos.slug}`}
                      target="_blank"
                    />
                  }
                  variant="ghost"
                  size="sm"
                  className="mt-2 -ml-2"
                >
                  Ver na vitrine
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground mt-3 text-sm">
                O contato veio pelo botao geral, sem um equipamento especifico.
              </p>
            )}
          </section>

          {pedido.mensagem && (
            <section className="bg-card rounded-xl border p-4">
              <h2 className="font-semibold">Mensagem</h2>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed whitespace-pre-line">
                {pedido.mensagem}
              </p>
            </section>
          )}
        </div>

        {/* ----------------------------------------------------------- */}
        <aside className="bg-card h-fit space-y-4 rounded-xl border p-4 lg:sticky lg:top-20">
          <div>
            <h2 className="mb-2 font-semibold">Situacao</h2>
            <SeletorStatusPedido id={pedido.id} status={pedido.status} />
          </div>

          <Separator />

          <Button
            render={
              <a
                href={montarLinkWhatsApp(pedido.telefone, mensagemWhatsApp)}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            variant="outline"
            className="w-full"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Responder no WhatsApp
          </Button>

          <ConverterPedido
            pedidoId={pedido.id}
            produtoId={pedido.produto_id}
            jaConvertido={Boolean(pedido.cliente_id)}
            clienteId={pedido.cliente_id}
          />

          {pedido.cliente_id && (
            <p className="text-muted-foreground text-xs">
              Este pedido ja esta ligado a um cliente do cadastro.{" "}
              <Link
                href={`/admin/clientes/${pedido.cliente_id}`}
                className="text-primary hover:underline"
              >
                Ver ficha
              </Link>
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
