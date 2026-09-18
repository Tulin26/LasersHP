import Image from "next/image";
import Link from "next/link";
import { ImageOff, Pencil, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { exigirAdmin, listarProdutos } from "@/lib/consultas/painel";
import { capaDoProduto } from "@/lib/imagens";
import { formatarMoeda } from "@/lib/formatar";
import { alternarAtivo } from "@/lib/acoes/produtos";

export default async function PaginaProdutos(
  props: PageProps<"/admin/produtos">,
) {
  // So admin gerencia catalogo — a policy do banco diz o mesmo, isto aqui e
  // para o vendedor nem chegar na tela e levar um erro seco.
  await exigirAdmin();

  const searchParams = await props.searchParams;
  const busca =
    typeof searchParams.busca === "string" ? searchParams.busca : "";

  const produtos = await listarProdutos(busca);

  return (
    <>
      <CabecalhoPagina
        titulo="Equipamentos"
        descricao="Catalogo da vitrine e controle de estoque."
      >
        <Button render={<Link href="/admin/produtos/novo" />} size="sm">
          <Plus className="size-4" aria-hidden="true" />
          Novo equipamento
        </Button>
      </CabecalhoPagina>

      <Avisos ok={searchParams.ok} erro={searchParams.erro} />

      <form method="get" className="flex max-w-sm gap-2">
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            name="busca"
            defaultValue={busca}
            placeholder="Buscar por nome ou modelo"
            className="pl-9"
            aria-label="Buscar equipamento"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Buscar
        </Button>
      </form>

      {produtos.length === 0 ? (
        <Vazio
          titulo={busca ? "Nenhum equipamento encontrado." : "Catalogo vazio."}
          descricao={
            busca
              ? "Tente outra palavra."
              : "Cadastre o primeiro equipamento para o site sair do ar vazio."
          }
          acao={
            busca
              ? undefined
              : { href: "/admin/produtos/novo", texto: "Cadastrar equipamento" }
          }
        />
      ) : (
        <div className="bg-card overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14"></TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead className="text-right">Preco</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead>Situacao</TableHead>
                <TableHead className="w-24 text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {produtos.map((p) => {
                const capa = capaDoProduto(p.imagens);
                const baixo = p.estoque <= p.estoque_minimo;

                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="bg-muted relative size-10 overflow-hidden rounded-md">
                        {capa ? (
                          <Image
                            src={capa}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="text-muted-foreground flex h-full items-center justify-center">
                            <ImageOff className="size-4" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Link
                        href={`/admin/produtos/${p.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.nome}
                      </Link>
                      {p.modelo && (
                        <span className="text-muted-foreground block text-xs">
                          {p.modelo}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right whitespace-nowrap">
                      {p.preco_sob_consulta || p.preco === null ? (
                        <span className="text-muted-foreground text-sm">
                          Sob consulta
                        </span>
                      ) : (
                        formatarMoeda(p.preco)
                      )}
                    </TableCell>

                    <TableCell
                      className={
                        baixo
                          ? "text-right font-semibold text-amber-600"
                          : "text-right"
                      }
                    >
                      {p.estoque}
                      <span className="text-muted-foreground ml-1 text-xs font-normal">
                        / {p.estoque_minimo}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {/*
                          Botao dentro de <form>: a acao muda dado no servidor,
                          entao precisa ser POST. Com Server Action isso sai
                          de graca e continua funcionando sem JavaScript.
                        */}
                        <form action={alternarAtivo}>
                          <input type="hidden" name="id" value={p.id} />
                          <input
                            type="hidden"
                            name="ativo"
                            value={String(p.ativo)}
                          />
                          <button type="submit" title="Clique para alternar">
                            <Badge
                              variant={p.ativo ? "secondary" : "outline"}
                              className="cursor-pointer"
                            >
                              {p.ativo ? "Na vitrine" : "Oculto"}
                            </Badge>
                          </button>
                        </form>

                        {p.destaque && <Badge>Destaque</Badge>}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        render={<Link href={`/admin/produtos/${p.id}`} />}
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Editar ${p.nome}`}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
