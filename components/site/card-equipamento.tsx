import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { capaDoProduto } from "@/lib/imagens";
import { formatarMoeda, resumir } from "@/lib/formatar";
import type { ProdutoPublico } from "@/lib/consultas/site";

/**
 * Card do catalogo.
 *
 * Sobre o next/image: ele nao e so um <img> mais bonito. O Next redimensiona
 * a foto no servidor, entrega em WebP/AVIF quando o navegador aceita e so
 * carrega quando ela chega perto da tela. Numa vitrine que vive de foto —
 * e cujo publico chega pelo celular, muitas vezes no 4G — isso e a diferenca
 * entre a pagina abrir em 1s ou em 6s.
 *
 * O `sizes` avisa qual largura a imagem vai ocupar em cada tamanho de tela,
 * para o Next nao mandar uma foto de 1200px onde cabem 300px.
 */
export function CardEquipamento({
  produto,
  prioridade = false,
}: {
  /* ProdutoPublico, nao Produto: este card so existe na vitrine, e a
     vitrine nao recebe os campos de estoque do banco. Tipar assim faz o
     compilador recusar qualquer tentativa de exibir estoque aqui. */
  produto: ProdutoPublico;
  /** true nos primeiros cards: carrega sem esperar, melhora o LCP. */
  prioridade?: boolean;
}) {
  const capa = capaDoProduto(produto.imagens);

  return (
    <Link
      href={`/equipamentos/${produto.slug}`}
      className="group focus-visible:ring-ring bg-card flex flex-col overflow-hidden rounded-xl border transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="bg-muted relative aspect-4/3 overflow-hidden">
        {capa ? (
          <Image
            src={capa}
            alt={produto.nome}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={prioridade}
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <ImageOff className="size-10" aria-hidden="true" />
          </div>
        )}

        {produto.destaque && (
          <Badge className="absolute top-3 left-3">Destaque</Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="leading-tight font-semibold">{produto.nome}</h3>
          {produto.modelo && (
            <p className="text-muted-foreground text-xs">{produto.modelo}</p>
          )}
        </div>

        {produto.descricao && (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {resumir(produto.descricao, 110)}
          </p>
        )}

        <p className="text-primary mt-auto pt-2 font-semibold">
          {produto.preco_sob_consulta || produto.preco === null
            ? "Sob consulta"
            : formatarMoeda(produto.preco)}
        </p>
      </div>
    </Link>
  );
}
