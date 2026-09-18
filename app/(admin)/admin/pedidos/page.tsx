import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avisos, CabecalhoPagina, Vazio } from "@/components/painel/ui-painel";
import { SeletorStatusPedido } from "@/components/painel/seletor-status-pedido";
import { exigirSessao, listarPedidos } from "@/lib/consultas/painel";
import { formatarDataHora, formatarTelefone } from "@/lib/formatar";
import { montarLinkWhatsApp } from "@/lib/whatsapp";
import { STATUS_PEDIDO } from "@/lib/constantes";
import { cn } from "@/lib/utils";

const FILTROS = [
  { valor: "todos", texto: "Todos" },
  { valor: "novo", texto: "Novos" },
  { valor: "em_contato", texto: "Em contato" },
  { valor: "fechado", texto: "Fechados" },
  { valor: "cancelado", texto: "Cancelados" },
];

export default async function PaginaPedidos(
  props: PageProps<"/admin/pedidos">,
) {
  await exigirSessao();

  const searchParams = await props.searchParams;
  const status =
    typeof searchParams.status === "string" ? searchParams.status : "todos";

  const pedidos = await listarPedidos(status);

  return (
    <>
      <CabecalhoPagina
        titulo="Pedidos"
        descricao="Tudo que chega pelo formulario do site cai aqui."
      />

      <Avisos ok={searchParams.ok} erro={searchParams.erro} />

      {/* Filtros como links: cada um e uma URL propria, da para favoritar. */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Link
            key={f.valor}
            href={`/admin/pedidos?status=${f.valor}`}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition",
              status === f.valor
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-muted",
            )}
          >
            {f.texto}
          </Link>
        ))}
      </div>

      {pedidos.length === 0 ? (
        <Vazio
          titulo="Nenhum pedido nesta situacao."
          descricao="Quando alguem preencher o formulario da vitrine, o contato aparece aqui na hora."
        />
      ) : (
        <div className="bg-card overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Situacao</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {pedidos.map((p) => (
                <TableRow
                  key={p.id}
                  className={p.status === "novo" ? "bg-primary/5" : undefined}
                >
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatarDataHora(p.criado_em)}
                  </TableCell>

                  <TableCell>
                    <Link
                      href={`/admin/pedidos/${p.id}`}
                      className="font-medium hover:underline"
                    >
                      {p.nome}
                    </Link>
                    <span className="text-muted-foreground block text-xs">
                      {formatarTelefone(p.telefone)}
                      {p.cidade ? ` · ${p.cidade}` : ""}
                    </span>
                  </TableCell>

                  <TableCell className="text-sm">
                    {p.produtos ? (
                      <>
                        {p.produtos.nome}
                        {p.produtos.modelo && (
                          <span className="text-muted-foreground block text-xs">
                            {p.produtos.modelo}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        Contato geral
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <SeletorStatusPedido id={p.id} status={p.status} />
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        render={
                          <a
                            href={montarLinkWhatsApp(
                              p.telefone,
                              `Ola ${p.nome}! Recebemos seu pedido${
                                p.produtos ? ` do ${p.produtos.nome}` : ""
                              } pelo site.`,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Responder ${p.nome} no WhatsApp`}
                      >
                        <MessageCircle className="size-4" aria-hidden="true" />
                      </Button>

                      <Button
                        render={<Link href={`/admin/pedidos/${p.id}`} />}
                        variant="outline"
                        size="sm"
                      >
                        Abrir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        Situacoes:{" "}
        {Object.values(STATUS_PEDIDO)
          .map((s) => s.texto)
          .join(" · ")}
      </p>
    </>
  );
}
