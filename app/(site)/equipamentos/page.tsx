import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardEquipamento } from "@/components/site/card-equipamento";
import { listarProdutosPublicos } from "@/lib/consultas/site";

export const metadata = {
  title: "Equipamentos",
  description:
    "Catalogo de equipamentos de laser para estetica: depilacao, rejuvenescimento e tratamentos de pele.",
};

/**
 * Catalogo.
 *
 * A busca e um <form method="get"> comum, sem JavaScript: o navegador manda
 * "?busca=..." na URL e o Next renderiza a pagina de novo no servidor. Isso
 * traz dois ganhos de graca — a busca fica compartilhavel por link e funciona
 * mesmo com o JavaScript desativado.
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

  const produtos = await listarProdutosPublicos(busca);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Equipamentos
        </h1>
        <p className="text-muted-foreground mt-2">
          Escolha o equipamento e faca sua encomenda em poucos minutos.
        </p>
      </header>

      <form method="get" className="mt-8 flex max-w-md gap-2">
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
        <div className="bg-muted/40 mt-12 rounded-xl border border-dashed p-12 text-center">
          <p className="font-medium">Nenhum equipamento encontrado.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {busca
              ? "Tente outra palavra ou fale com a gente pelo WhatsApp."
              : "O catalogo ainda esta sendo montado. Volte em breve."}
          </p>
          {busca && (
            <Button
              render={<Link href="/equipamentos" />}
              variant="outline"
              className="mt-4"
            >
              Limpar busca
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

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {produtos.map((produto, indice) => (
              <CardEquipamento
                key={produto.id}
                produto={produto}
                prioridade={indice < 3}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
