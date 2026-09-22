import Link from "next/link";
import { faixaDoEquipamento, lerComprimentos } from "@/lib/espectro";
import { ETIQUETA_AREA } from "@/lib/areas";
import type { ProdutoPublico } from "@/lib/consultas/site";

/**
 * O espectro que o catalogo cobre.
 *
 * ---------------------------------------------------------------------------
 * O que estava aqui antes
 * ---------------------------------------------------------------------------
 * Quatro cartoes num grid 2x2, cada um com um icone da lucide e uma frase:
 * "Equipamentos homologados", "Suporte de verdade", "Entrega para todo o
 * Brasil", "Garantia e assistencia". Sao promessas que qualquer empresa de
 * qualquer setor poderia fazer, e o arranjo 2x2 ao lado do titulo e o padrao
 * mais repetido de pagina inicial gerada. Nada ali dizia o que esta loja
 * vende.
 *
 * ---------------------------------------------------------------------------
 * O que esta aqui agora
 * ---------------------------------------------------------------------------
 * Uma lista dos comprimentos de onda que o catalogo realmente cobre, do mais
 * curto ao mais longo, cada um na cor correspondente do espectro. Um
 * profissional da area bate o olho e entende o alcance da loja em dois
 * segundos: "532, 660, 808, 1064, 10600 — tem o que eu preciso".
 *
 * A informacao sai do banco. Cadastrou equipamento novo, a faixa muda
 * sozinha. Nao ha lista escrita a mao para desatualizar.
 */
export function EspectroCatalogo({
  produtos,
}: {
  produtos: ProdutoPublico[];
}) {
  /*
   * Junta os comprimentos de todos os equipamentos, tira repetidos e ordena.
   * Um aparelho de triplice onda contribui com tres numeros; radiofrequencia
   * e criolipolise nao contribuem com nenhum, porque nao sao luz.
   */
  const comprimentos = [
    ...new Set(produtos.flatMap((p) => lerComprimentos(p.comprimento_onda))),
  ].sort((a, b) => a - b);

  if (comprimentos.length === 0) return null;

  const visiveis = comprimentos.filter((n) => n <= 700);
  const infravermelhos = comprimentos.filter((n) => n > 700);

  return (
    <div className="bg-card/60 rounded-xl border p-5 backdrop-blur-sm sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-sm font-semibold">
          O espectro que atendemos
        </h2>
        <span className="text-muted-foreground font-mono text-[11px]">
          {comprimentos.length} comprimentos
        </span>
      </div>

      <ul className="mt-4 space-y-2.5">
        {comprimentos.map((nm) => {
          const { degrade } = faixaDoEquipamento(String(nm));

          /*
           * A largura da barra e proporcional ao comprimento de onda, mas em
           * escala logaritmica. Em escala linear, 10600 nm empurraria todo o
           * resto para um tracinho no canto — a diferenca entre 532 e 660
           * sumiria. O log comprime a ponta longa e devolve legibilidade a
           * faixa de baixo, que e onde estao quase todos os aparelhos.
           */
          const proporcao =
            (Math.log(nm) - Math.log(400)) / (Math.log(11000) - Math.log(400));
          const largura = 28 + proporcao * 72;

          return (
            <li key={nm} className="flex items-center gap-3">
              <span className="text-muted-foreground w-14 shrink-0 text-right font-mono text-xs tabular-nums">
                {nm}
              </span>
              {/* data-barra: a ancora que o GSAP usa para animar a largura.
                  Marcar com atributo de dado, e nao com a classe do Tailwind,
                  deixa claro que aquilo e ponto de script — mexer na classe
                  nao quebra a animacao sem querer. */}
              <span
                data-barra
                className="h-2.5 rounded-full"
                style={{ backgroundImage: degrade, width: `${largura}%` }}
                aria-hidden="true"
              />
            </li>
          );
        })}
      </ul>

      <p className="text-muted-foreground mt-4 border-t pt-3 text-xs leading-relaxed">
        {visiveis.length > 0 && (
          <>
            <strong className="text-foreground font-medium">
              {visiveis.join(", ")} nm
            </strong>{" "}
            estão na faixa que o olho enxerga.{" "}
          </>
        )}
        {infravermelhos.length > 0 && (
          <>
            De <strong className="text-foreground font-medium">
              {infravermelhos[0]} nm
            </strong>{" "}
            para cima é infravermelho: invisível, e onde trabalha a maior parte
            dos aparelhos clínicos.
          </>
        )}
      </p>
    </div>
  );
}

/**
 * As duas frentes, lado a lado.
 *
 * Substitui o texto generico "atendemos clinicas e profissionais" por algo
 * que o visitante usa: ele se reconhece numa das duas e clica direto no
 * catalogo filtrado, em vez de rolar setenta equipamentos que nao servem
 * para ele.
 */
export function DuasFrentes({
  contagem,
}: {
  contagem: { estetica: number; saude: number };
}) {
  const frentes = [
    { chave: "estetica" as const, total: contagem.estetica },
    { chave: "saude" as const, total: contagem.saude },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {frentes.map(({ chave, total }) => {
        const info = ETIQUETA_AREA[chave];

        return (
          <Link
            key={chave}
            href={`/equipamentos?area=${chave}`}
            className="group focus-visible:ring-ring bg-card relative overflow-hidden rounded-lg border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_-12px_rgb(0_0_0/0.16)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:p-6"
          >
            {/* Barra de cor da frente, no topo do card. */}
            <span
              className="absolute inset-x-0 top-0 h-1"
              style={{ backgroundColor: info.texto }}
              aria-hidden="true"
            />

            <p
              className="font-mono text-[11px] tracking-widest uppercase"
              style={{ color: info.texto }}
            >
              {info.curto}
            </p>

            <h3 className="font-heading mt-2 text-xl font-semibold">
              {info.longo}
            </h3>

            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {info.descricao}
            </p>

            <p className="text-foreground mt-4 text-sm font-medium">
              {total} {total === 1 ? "equipamento" : "equipamentos"}
              <span className="text-muted-foreground ml-1 font-normal transition group-hover:translate-x-0.5">
                &rarr;
              </span>
            </p>
          </Link>
        );
      })}
    </div>
  );
}
