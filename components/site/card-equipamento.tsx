import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { capaDoProduto } from "@/lib/imagens";
import { formatarMoeda, resumir } from "@/lib/formatar";
import { faixaDoEquipamento } from "@/lib/espectro";
import { ETIQUETA_AREA } from "@/lib/areas";
import type { ProdutoPublico } from "@/lib/consultas/site";

/**
 * Card do catalogo.
 *
 * ---------------------------------------------------------------------------
 * O problema que este desenho resolve
 * ---------------------------------------------------------------------------
 * Nenhum equipamento tem foto ainda. A versao anterior mostrava um retangulo
 * cinza com um icone de imagem quebrada — tres deles lado a lado na home,
 * que e a impressao mais forte de pagina inacabada que existe.
 *
 * Em vez de esconder a ausencia, o card passou a usar o dado que o negocio
 * tem de sobra: o comprimento de onda. Cada equipamento ganha a faixa do
 * espectro correspondente (lib/espectro.ts) — o CO2 de 10600 nm aparece num
 * infravermelho profundo, o terapeutico de 660 nm num vermelho vivo, o
 * Nd:YAG de 532/1064 num degrade de verde a infravermelho.
 *
 * O resultado: cada card fica visualmente diferente do vizinho, por um
 * motivo tecnico verdadeiro, e nao por decoracao sorteada. Quando as fotos
 * chegarem, elas entram no lugar da faixa e o resto continua igual.
 *
 * Sobre o next/image: ele nao e so um <img> mais bonito. Redimensiona no
 * servidor, entrega WebP/AVIF quando o navegador aceita e so carrega quando a
 * imagem chega perto da tela. Numa vitrine que vive de foto — e cujo publico
 * chega pelo celular, muitas vezes no 4G — isso e a diferenca entre a pagina
 * abrir em 1s ou em 6s.
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
  const faixa = faixaDoEquipamento(produto.comprimento_onda);
  const area = ETIQUETA_AREA[produto.area];

  return (
    <Link
      href={`/equipamentos/${produto.slug}`}
      className="group focus-visible:ring-ring bg-card relative flex flex-col overflow-hidden rounded-lg border transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_-12px_rgb(0_0_0/0.18)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="bg-muted relative aspect-[4/3] overflow-hidden">
        {capa ? (
          <Image
            src={capa}
            alt={produto.nome}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={prioridade}
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          /*
           * Sem foto: a faixa do espectro. O degrade vem por `style` porque
           * e calculado a partir do comprimento de onda de cada equipamento —
           * não ha como escrever isso como classe fixa do Tailwind.
           */
          <div
            className="absolute inset-0 transition duration-500 group-hover:scale-[1.06]"
            style={{ backgroundImage: faixa.degrade }}
            aria-hidden="true"
          >
            {/* Linhas finas na diagonal: dao textura de feixe e evitam que a
                area vire uma chapa de cor lisa. */}
            <div
              className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(115deg, transparent 0 6px, white 6px 7px)",
              }}
            />
            {/* Escurece embaixo para o texto branco ter contraste garantido. */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
              <span className="font-heading text-2xl leading-none font-semibold text-white/95 tabular-nums">
                {faixa.rotulo ?? produto.modelo ?? "—"}
              </span>
            </div>
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {produto.destaque && <Badge>Destaque</Badge>}
          {/*
            A etiqueta fica por cima da faixa do espectro, que pode ser clara
            (532 nm, verde) ou quase preta (10600 nm). Cor do texto tirada da
            propria area nao serve: alguma combinacao sempre some no fundo.
            Por isso o fundo e branco translucido fixo com texto escuro, que
            se le sobre qualquer cor, e a area aparece na bolinha ao lado.
          */}
          <span className="flex items-center gap-1.5 rounded-full bg-white/92 px-2 py-1 text-[11px] font-medium text-neutral-800 shadow-sm backdrop-blur-sm">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: area.texto }}
              aria-hidden="true"
            />
            {area.curto}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="font-heading leading-tight font-semibold">
            {produto.nome}
          </h3>
          {produto.modelo && (
            <p className="text-muted-foreground font-mono text-[11px] tracking-wide uppercase">
              {produto.modelo}
            </p>
          )}
        </div>

        {produto.descricao && (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {resumir(produto.descricao, 110)}
          </p>
        )}

        <p className="text-foreground mt-auto pt-2 font-semibold">
          {produto.preco_sob_consulta || produto.preco === null ? (
            <span className="text-muted-foreground font-normal">
              Sob consulta
            </span>
          ) : (
            formatarMoeda(produto.preco)
          )}
        </p>
      </div>
    </Link>
  );
}
