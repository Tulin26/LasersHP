import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardEquipamento } from "@/components/site/card-equipamento";
import { ListaAnimada } from "@/components/site/lista-animada";
import { listarProdutosPublicos } from "@/lib/consultas/site";
import { ETIQUETA_AREA } from "@/lib/areas";
import type { AreaAtuacao } from "@/lib/tipos/database.types";

export const metadata = {
  title: "Equipamentos",
  description:
    "Catálogo de equipamentos de laser para estética e saúde: depilação, rejuvenescimento, fotobiomodulação e laserterapia.",
};

/** Os filtros que aparecem como abas acima do catalogo. */
const FILTROS: { valor: AreaAtuacao | "todos"; texto: string }[] = [
  { valor: "todos", texto: "Todos" },
  { valor: "estetica", texto: ETIQUETA_AREA.estetica.curto },
  { valor: "saude", texto: ETIQUETA_AREA.saude.curto },
];

/**
 * Catalogo.
 *
 * A busca e o filtro sao um <form method="get"> comum, sem JavaScript: o
 * navegador manda "?busca=...&area=..." na URL e o Next renderiza a pagina de
 * novo no servidor. Isso traz dois ganhos de graca — o resultado fica
 * compartilhavel por link e funciona mesmo com o JavaScript desativado.
 *
 * No Next 16 `searchParams` e uma Promise. O motivo: a pagina pode comecar a
 * renderizar antes de os parametros estarem resolvidos, e o await marca
 * exatamente o ponto em que ela passa a depender deles.
 */
export default async function PaginaEquipamentos(
  props: PageProps<"/equipamentos">,
) {
  const searchParams = await props.searchParams;

  const busca =
    typeof searchParams.busca === "string" ? searchParams.busca : "";

  const areaPedida =
    searchParams.area === "estetica" || searchParams.area === "saude"
      ? (searchParams.area as AreaAtuacao)
      : null;

  const todos = await listarProdutosPublicos(busca);

  /*
   * O filtro roda aqui e nao no SQL de proposito: "ambas" precisa aparecer
   * nas duas listas. Uma clausula `where area = 'estetica'` esconderia o CO2
   * fracionado de quem procura estetica, sendo que ele serve as duas.
   */
  const produtos = areaPedida
    ? todos.filter((p) => p.area === areaPedida || p.area === "ambas")
    : todos;

  const infoArea = areaPedida ? ETIQUETA_AREA[areaPedida] : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {infoArea ? infoArea.longo : "Equipamentos"}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          {infoArea
            ? infoArea.descricao
            : "Estética e saúde na mesma casa. Escolha o equipamento e faça sua encomenda em poucos minutos."}
        </p>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* Filtro por frente                                              */}
      {/* ------------------------------------------------------------- */}
      <nav
        className="mt-6 flex flex-wrap gap-2"
        aria-label="Filtrar por área de atuação"
      >
        {FILTROS.map(({ valor, texto }) => {
          const ativo =
            valor === "todos" ? areaPedida === null : areaPedida === valor;

          /* Mantem a busca digitada ao trocar de aba. */
          const destino =
            valor === "todos"
              ? busca
                ? `/equipamentos?busca=${encodeURIComponent(busca)}`
                : "/equipamentos"
              : `/equipamentos?area=${valor}${busca ? `&busca=${encodeURIComponent(busca)}` : ""}`;

          return (
            <Link
              key={valor}
              href={destino}
              aria-current={ativo ? "page" : undefined}
              className={
                ativo
                  ? "bg-foreground text-background rounded-full px-4 py-1.5 text-sm font-medium transition"
                  : "hover:bg-muted rounded-full border px-4 py-1.5 text-sm font-medium transition"
              }
            >
              {texto}
            </Link>
          );
        })}
      </nav>

      <form method="get" className="mt-4 flex max-w-md gap-2">
        {/* Preserva a aba ativa quando alguem busca. */}
        {areaPedida && <input type="hidden" name="area" value={areaPedida} />}

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
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      {produtos.length === 0 ? (
        <div className="bg-muted/40 mt-12 rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium">Nenhum equipamento encontrado.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {busca || areaPedida
              ? "Tente outra palavra ou fale com a gente pelo WhatsApp."
              : "O catálogo ainda está sendo montado. Volte em breve."}
          </p>
          {(busca || areaPedida) && (
            <Button
              render={<Link href="/equipamentos" />}
              variant="outline"
              className="mt-4"
            >
              Ver todos
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-muted-foreground mt-6 text-sm">
            {produtos.length}{" "}
            {produtos.length === 1
              ? "equipamento encontrado"
              : "equipamentos encontrados"}
          </p>

          <ListaAnimada className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {produtos.map((produto, indice) => (
              <CardEquipamento
                key={produto.id}
                produto={produto}
                prioridade={indice < 3}
              />
            ))}
          </ListaAnimada>
        </>
      )}
    </div>
  );
}
