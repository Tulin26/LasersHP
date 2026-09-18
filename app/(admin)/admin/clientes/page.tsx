import Link from "next/link";
import { MessageCircle, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avisos, CabecalhoPagina, Vazio } from "@/components/painel/ui-painel";
import { FormularioCliente } from "@/components/painel/formulario-cliente";
import { exigirSessao, listarClientes } from "@/lib/consultas/painel";
import {
  formatarData,
  formatarDocumento,
  formatarTelefone,
} from "@/lib/formatar";
import { montarLinkWhatsApp } from "@/lib/whatsapp";

export default async function PaginaClientes(
  props: PageProps<"/admin/clientes">,
) {
  await exigirSessao();

  const searchParams = await props.searchParams;
  const busca =
    typeof searchParams.busca === "string" ? searchParams.busca : "";

  const clientes = await listarClientes(busca);

  return (
    <>
      <CabecalhoPagina
        titulo="Clientes"
        descricao="Quem ja comprou ou esta em negociacao."
      />

      <Avisos ok={searchParams.ok} erro={searchParams.erro} />

      {/*
        <details> e um elemento nativo do HTML: abre e fecha sem uma linha de
        JavaScript. Para um formulario que fica fechado a maior parte do tempo,
        e mais leve que qualquer componente de acordeao.
      */}
      <details className="bg-card group rounded-xl border">
        <summary className="flex cursor-pointer items-center gap-2 p-4 font-medium select-none">
          <Plus
            className="size-4 transition group-open:rotate-45"
            aria-hidden="true"
          />
          Cadastrar novo cliente
        </summary>
        <div className="border-t p-4">
          <FormularioCliente />
        </div>
      </details>

      <form method="get" className="flex max-w-sm gap-2">
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            name="busca"
            defaultValue={busca}
            placeholder="Nome, telefone, documento ou cidade"
            className="pl-9"
            aria-label="Buscar cliente"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Buscar
        </Button>
      </form>

      {clientes.length === 0 ? (
        <Vazio
          titulo={busca ? "Nenhum cliente encontrado." : "Nenhum cliente ainda."}
          descricao={
            busca
              ? "Tente outra palavra."
              : "Cadastre pelo formulario acima ou converta um pedido do site em cliente."
          }
        />
      ) : (
        <div className="bg-card overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {clientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={`/admin/clientes/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.nome}
                    </Link>
                    {c.telefone && (
                      <span className="text-muted-foreground block text-xs">
                        {formatarTelefone(c.telefone)}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-sm">
                    {c.documento ? formatarDocumento(c.documento) : "—"}
                  </TableCell>

                  <TableCell className="text-sm">{c.cidade ?? "—"}</TableCell>

                  <TableCell className="text-muted-foreground text-xs">
                    {formatarData(c.criado_em)}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {c.telefone && (
                        <Button
                          render={
                            <a
                              href={montarLinkWhatsApp(c.telefone)}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`WhatsApp de ${c.nome}`}
                        >
                          <MessageCircle
                            className="size-4"
                            aria-hidden="true"
                          />
                        </Button>
                      )}
                      <Button
                        render={<Link href={`/admin/clientes/${c.id}`} />}
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
    </>
  );
}
