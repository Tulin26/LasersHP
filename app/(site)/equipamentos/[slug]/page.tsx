import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GaleriaProduto } from "@/components/site/galeria-produto";
import { FichaTecnica } from "@/components/site/ficha-tecnica";
import { FormularioEncomenda } from "@/components/site/formulario-encomenda";
import {
  buscarConfiguracoes,
  buscarProdutoPorSlug,
} from "@/lib/consultas/site";
import { capaDoProduto } from "@/lib/imagens";
import { formatarMoeda } from "@/lib/formatar";

/**
 * Pagina de detalhe do equipamento.
 *
 * O `[slug]` no nome da pasta e um parametro dinamico: /equipamentos/laser-x
 * chega aqui com params.slug = "laser-x". Em PHP voce faria isso com
 * ?produto=laser-x ou uma regra de rewrite; aqui a propria pasta ja define
 * a rota.
 */

export async function generateMetadata({
  params,
}: PageProps<"/equipamentos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const produto = await buscarProdutoPorSlug(slug);

  if (!produto) return { title: "Equipamento nao encontrado" };

  const descricao =
    produto.descricao?.slice(0, 200) ??
    `${produto.nome} disponivel na nossa loja. Fale com a gente pelo WhatsApp.`;

  const capa = capaDoProduto(produto.imagens);

  return {
    title: produto.nome,
    description: descricao,
    openGraph: {
      title: produto.nome,
      description: descricao,
      type: "website",
      // Esta e a imagem que aparece quando o link e colado no WhatsApp.
      images: capa ? [{ url: capa }] : undefined,
    },
  };
}

export default async function PaginaEquipamento({
  params,
}: PageProps<"/equipamentos/[slug]">) {
  const { slug } = await params;

  const [produto, config] = await Promise.all([
    buscarProdutoPorSlug(slug),
    buscarConfiguracoes(),
  ]);

  // notFound() devolve 404 de verdade (nao uma pagina bonita com status 200),
  // que e o que o Google espera de um produto que saiu do ar.
  if (!produto) notFound();

  const temPreco = !produto.preco_sob_consulta && produto.preco !== null;
  // `disponivel` vem calculado do banco (estoque > 0). A vitrine nunca
  // recebe a quantidade em si: quantas unidades ha e informacao do negocio,
  // nao do visitante.
  const disponivel = produto.disponivel;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <Button
        render={<Link href="/equipamentos" />}
        variant="ghost"
        size="sm"
        className="-ml-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar ao catálogo
      </Button>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <GaleriaProduto
          imagens={produto.imagens}
          nome={produto.nome}
          comprimentoOnda={produto.comprimento_onda}
        />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {produto.destaque && <Badge>Destaque</Badge>}
            <Badge variant={disponivel ? "secondary" : "outline"}>
              <Package className="size-3" aria-hidden="true" />
              {disponivel ? "Disponível" : "Sob encomenda"}
            </Badge>
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {produto.nome}
          </h1>

          {produto.modelo && (
            <p className="text-muted-foreground mt-1">
              Modelo {produto.modelo}
            </p>
          )}

          <p className="text-primary mt-5 text-3xl font-semibold">
            {temPreco ? formatarMoeda(produto.preco) : "Sob consulta"}
          </p>

          {!temPreco && (
            <p className="text-muted-foreground mt-1 text-sm">
              Fale com a gente para receber o valor e as condições.
            </p>
          )}

          {produto.descricao && (
            <>
              <Separator className="my-6" />
              <section>
                <h2 className="font-semibold">Descrição</h2>
                <p className="text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">
                  {produto.descricao}
                </p>
              </section>
            </>
          )}

          <Separator className="my-6" />
          <FichaTecnica
            comprimentoOnda={produto.comprimento_onda}
            area={produto.area}
            modelo={produto.modelo}
          />

          {produto.indicacoes && (
            <>
              <Separator className="my-6" />
              <section>
                <h2 className="font-semibold">Indicações de uso</h2>
                <ul className="mt-3 space-y-2">
                  {produto.indicacoes
                    .split(/\r?\n/)
                    .map((linha) => linha.trim())
                    .filter(Boolean)
                    .map((linha) => (
                      <li
                        key={linha}
                        className="text-muted-foreground flex gap-2 text-sm"
                      >
                        <CheckCircle2
                          className="text-primary mt-0.5 size-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{linha}</span>
                      </li>
                    ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>

      <div className="mt-12 lg:mt-16">
        <div className="mx-auto max-w-2xl">
          <FormularioEncomenda
            produtoId={produto.id}
            produtoNome={
              produto.modelo
                ? `${produto.nome} (${produto.modelo})`
                : produto.nome
            }
            whatsapp={config.whatsapp}
          />
        </div>
      </div>
    </div>
  );
}
