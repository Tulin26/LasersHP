"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { capaDoProduto } from "@/lib/imagens";
import { formatarMoeda } from "@/lib/formatar";
import { corDoComprimento, lerComprimentos } from "@/lib/espectro";
import { ETIQUETA_AREA } from "@/lib/areas";
import { montarLinkWhatsApp, mensagemDeEncomenda } from "@/lib/whatsapp";
import type { ProdutoPublico } from "@/lib/consultas/site";

/**
 * O trilho de destaques.
 *
 * ---------------------------------------------------------------------------
 * O que e
 * ---------------------------------------------------------------------------
 * Uma faixa escura onde os equipamentos em destaque ficam enfileirados em
 * perspectiva, apoiados numa mesma bancada, e o do meio aparece ACESO — com a
 * luz que ele emite de verdade. Arrasta com o dedo, com o mouse ou com as
 * setas, e da a volta no fim da lista.
 *
 * E um Client Component porque precisa de estado e de eventos de ponteiro. Os
 * DADOS continuam vindo do servidor: a home busca no banco e passa a lista
 * pronta por props. O JavaScript que desce para o navegador e so o da
 * interacao.
 *
 * ---------------------------------------------------------------------------
 * Como a perspectiva e feita
 * ---------------------------------------------------------------------------
 * Nao usa 3D. Cada aparelho recebe posicao e tamanho calculados a partir da
 * DISTANCIA ate o que esta em foco (`d`). O tamanho cresce em progressao
 * geometrica com `d`, o que produz o efeito de corredor: os aparelhos vem se
 * aproximando da esquerda, se acumulando no horizonte, e saem grandes pela
 * direita.
 *
 * Todos apoiam na mesma linha porque a escala parte da base
 * (`transform-origin: bottom center`, no globals.css).
 *
 * ---------------------------------------------------------------------------
 * A luz
 * ---------------------------------------------------------------------------
 * O brilho em volta do aparelho aceso NAO e uma cor decorativa escolhida a
 * mao: e a cor do comprimento de onda dele, pela mesma funcao que pinta o
 * espectro do catalogo. Um 808 nm brilha como infravermelho proximo, um
 * 532 nm brilha verde. Equipamento que nao e luz — radiofrequencia,
 * criolipolise — nao acende: recebe um brilho neutro, de iluminacao de
 * estudio, porque inventar cor ali seria mentir sobre o produto.
 */

const entre = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Quanto cada passo para a direita aumenta o aparelho. */
const PASSO_ESCALA = 1.24;

/**
 * Tamanho do aparelho em foco, em fracao da altura do trilho.
 * Sobra espaco de proposito: o proximo e MAIOR que o em foco e precisa caber
 * sem ter a cabeca cortada — aparelho decapitado parece defeito.
 */
const TAMANHO_FOCO = 0.78;

/** Onde fica, na largura do trilho, o aparelho em foco. */
const FOCO = 46;

/** Espacamento de um passo para a direita, em % da largura do trilho. */
const PASSO_X = 34;

/** Ate onde os aparelhos que recuam se acumulam, a esquerda. */
const LIMITE_X = 42;

/**
 * Deslocamento do aparelho `d` passos a frente, em % da largura do trilho.
 *
 * Os dois lados se comportam diferente de proposito:
 *
 *   direita (d >= 0) — passo constante. O proximo entra grande e sai cortado
 *                      pela borda, como quem vem vindo na sua direcao.
 *   esquerda (d < 0) — a distancia SATURA em LIMITE_X. Os que ficaram para
 *                      tras se amontoam perto do mesmo ponto, que e o que o
 *                      olho entende como "longe". Espalhar em passo constante
 *                      daria uma fila lateral, nao um horizonte.
 *
 * As duas metades se encontram em d = 0 com o mesmo valor e a mesma
 * inclinacao (a derivada de ambas em zero vale PASSO_X), entao o arraste
 * atravessa o zero sem solavanco.
 */
function posicao(d: number): number {
  if (d >= 0) return PASSO_X * d;
  return -LIMITE_X * (1 - Math.exp((d * PASSO_X) / LIMITE_X));
}

function escala(d: number): number {
  // O teto de 0,98 impede o aparelho da borda direita de ter a cabeca cortada
  // pelo topo do trilho. Ele ainda entra maior que o em foco.
  return entre(TAMANHO_FOCO * Math.pow(PASSO_ESCALA, d), 0.1, 0.98);
}

/** A cor da luz que o equipamento emite. Neutra quando ele nao e luz. */
function luzDo(produto: ProdutoPublico): string {
  const nms = lerComprimentos(produto.comprimento_onda);
  if (nms.length === 0) return "oklch(0.85 0.02 290)";
  return corDoComprimento(nms[0]);
}

export function TrilhoDestaques({
  produtos,
  whatsapp,
}: {
  produtos: ProdutoPublico[];
  whatsapp: string;
}) {
  const total = produtos.length;

  /**
   * O trilho da a volta quando ha aparelhos suficientes.
   *
   * Com o laco ligado, `indice` deixa de ser a posicao dentro do array e vira
   * um contador que cresce (ou diminui) para sempre. O aparelho de cada
   * posicao sai de `emPosicao()`, que traz o contador de volta para dentro do
   * array. Assim nao existe "fim do trilho" — a direita nunca fica vazia.
   *
   * Abaixo de tres o laco fica desligado: a volta mostraria o mesmo aparelho
   * duas vezes na tela ao mesmo tempo, o que parece defeito, nao continuidade.
   */
  const emLaco = total >= 3;

  // Comeca no segundo: assim ja ha um recuando a esquerda e outros chegando
  // pela direita. Comecar no primeiro deixaria metade da faixa vazia.
  const indiceInicial = Math.min(1, total - 1);
  const [indice, setIndice] = useState(indiceInicial);

  // Fracao de passo durante o arraste. Fica em 0 quando ninguem esta puxando.
  const [fracao, setFracao] = useState(0);
  const [arrastando, setArrastando] = useState(false);

  const trilho = useRef<HTMLDivElement>(null);
  const inicioX = useRef(0);

  const ultimo = total - 1;

  /** Traz qualquer contador para dentro do array (-1 vira o ultimo). */
  const emPosicao = (k: number) => produtos[((k % total) + total) % total];

  const alvo = emLaco
    ? indice + fracao
    : entre(indice + fracao, -0.4, ultimo + 0.4);
  const emFoco = emPosicao(indice);

  /**
   * Quantos aparecem de cada lado do que esta em foco.
   *
   * Sao DOIS a direita porque o segundo entra cortado pela borda: e ele que
   * faz o trilho parecer continuar para fora da tela. Com so um, o canto
   * direito fica vazio e a sensacao de corredor morre.
   *
   * A esquerda o limite e o tamanho da lista menos dois, para o mesmo
   * aparelho nao aparecer duas vezes em tamanho legivel.
   */
  const aEsquerda = emLaco ? Math.min(total - 2, 4) : ultimo;
  const aDireita = emLaco ? 2 : ultimo;

  const base = Math.round(alvo);
  const posicoes: number[] = [];
  for (let k = base - aEsquerda; k <= base + aDireita; k++) {
    if (!emLaco && (k < 0 || k > ultimo)) continue;
    posicoes.push(k);
  }

  /**
   * Quais ja estao na tela no primeiro desenho — os que carregam sem esperar.
   * Nao da para usar "os primeiros da lista": com o laco, a posicao a esquerda
   * do inicio ja mostra o ULTIMO. A conta usa a mesma janela do trilho.
   */
  const visiveisNoInicio = new Set<number>();
  for (let k = indiceInicial - aEsquerda; k <= indiceInicial + aDireita; k++) {
    if (!emLaco && (k < 0 || k > ultimo)) continue;
    visiveisNoInicio.add(((k % total) + total) % total);
  }

  function irPara(novo: number) {
    setIndice(emLaco ? novo : entre(novo, 0, ultimo));
  }

  /** Qual aparelho da lista esta em foco agora (0..total-1). */
  const focoNaLista = ((indice % total) + total) % total;

  /**
   * Vai para um aparelho escolhido nos tracinhos, pelo caminho mais curto.
   * Sem isso, estando no ultimo e clicando no primeiro, o trilho giraria a
   * lista inteira para tras em vez de dar um passo a frente.
   */
  function irParaAparelho(i: number) {
    if (!emLaco) return irPara(i);
    let passos = i - focoNaLista;
    if (passos > total / 2) passos -= total;
    if (passos < -total / 2) passos += total;
    irPara(indice + passos);
  }

  function aoPressionar(evento: React.PointerEvent<HTMLDivElement>) {
    if (evento.button !== 0) return; // botao do meio ou direito nao arrasta
    inicioX.current = evento.clientX;
    setArrastando(true);
    evento.currentTarget.setPointerCapture(evento.pointerId);
  }

  function aoMover(evento: React.PointerEvent<HTMLDivElement>) {
    if (!arrastando) return;
    const largura = trilho.current?.clientWidth ?? 1;
    // Um passo equivale a ~30% da largura, que e o espacamento da progressao.
    const passo = largura * 0.3;
    // Arrastar para a ESQUERDA traz o proximo: dx negativo => avanca.
    setFracao(entre(-(evento.clientX - inicioX.current) / passo, -1.4, 1.4));
  }

  function aoSoltar() {
    if (!arrastando) return;
    setArrastando(false);
    irPara(Math.round(indice + fracao));
    setFracao(0);
  }

  function aoTeclar(evento: React.KeyboardEvent<HTMLDivElement>) {
    if (evento.key === "ArrowRight") {
      evento.preventDefault();
      irPara(indice + 1);
    } else if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      irPara(indice - 1);
    }
  }

  if (total === 0) return null;

  return (
    <section className="palco border-y">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="relative lg:min-h-[42rem]">
          {/* ---------------------------------------------------------- */}
          {/* O trilho                                                    */}
          {/* ---------------------------------------------------------- */}
          <div
            ref={trilho}
            role="group"
            aria-label="Equipamentos em destaque"
            aria-roledescription="carrossel"
            tabIndex={0}
            onPointerDown={aoPressionar}
            onPointerMove={aoMover}
            onPointerUp={aoSoltar}
            onPointerCancel={aoSoltar}
            onKeyDown={aoTeclar}
            className="palco-bancada relative mb-16 h-[20rem] touch-pan-y rounded-sm select-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none sm:h-[26rem] lg:absolute lg:inset-x-0 lg:top-14 lg:mb-0 lg:h-[32rem]"
            style={{ cursor: arrastando ? "grabbing" : "grab" }}
          >
            {/* A poca de luz na bancada, embaixo do aparelho aceso. */}
            <div
              aria-hidden="true"
              className="poca"
              style={
                {
                  left: `calc(${FOCO}% + ${posicao(indice - alvo)}%)`,
                  opacity: arrastando ? 0.45 : 1,
                  "--luz": luzDo(emFoco),
                } as React.CSSProperties
              }
            />

            {posicoes.map((k) => {
              const produto = emPosicao(k);
              const capa = capaDoProduto(produto.imagens);
              if (!capa) return null;

              const d = k - alvo;
              const aceso = k === indice && !arrastando;
              const indiceProduto = ((k % total) + total) % total;

              return (
                <button
                  // A chave e a POSICAO no trilho, nao o id do produto: com o
                  // laco o mesmo aparelho reaparece em outra posicao, e usar o
                  // id faria o React embaralhar os elementos no meio da
                  // animacao em vez de deixar cada um seguir o seu caminho.
                  key={k}
                  type="button"
                  onClick={() => irPara(k)}
                  aria-label={`Ver ${produto.nome}`}
                  aria-current={k === indice ? "true" : undefined}
                  tabIndex={-1}
                  className={`peca ${aceso ? "" : "peca-apagada"} aspect-[2/3] h-full`}
                  style={{
                    left: `calc(${FOCO}% + ${posicao(d)}%)`,
                    transform: `translateX(-50%) scale(${escala(d)})`,
                    // Durante o arraste a peca acompanha o dedo, sem suavizar.
                    transition: arrastando ? "none" : undefined,
                    // O brilho segue o CONTORNO do recorte: drop-shadow
                    // respeita o alpha do PNG, diferente de box-shadow, que
                    // respeitaria o retangulo. Por isso funciona com qualquer
                    // formato de aparelho, sem marcar onde fica a ponteira.
                    filter: aceso
                      ? `drop-shadow(0 0 2.5rem oklch(from ${luzDo(produto)} l c h / 0.36)) drop-shadow(0 0 0.75rem oklch(from ${luzDo(produto)} l c h / 0.24))`
                      : undefined,
                    // Quem esta mais a direita cobre quem esta atras.
                    zIndex: 10 + (k - base) + aEsquerda,
                    opacity: entre(1.15 - Math.abs(d) * 0.22, 0, 1),
                  }}
                >
                  <span className="relative block h-full w-full">
                    <Image
                      src={capa}
                      alt={produto.nome}
                      fill
                      sizes="(max-width: 640px) 60vw, (max-width: 1024px) 40vw, 30vw"
                      priority={visiveisNoInicio.has(indiceProduto)}
                      draggable={false}
                      className="object-contain object-bottom"
                    />
                  </span>

                  {/* Reflexo na bancada: a mesma foto, espelhada e sumindo. */}
                  <span
                    aria-hidden="true"
                    className="reflexo pointer-events-none absolute inset-x-0 top-full block h-full"
                  >
                    <Image
                      src={capa}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 60vw, 30vw"
                      // Mesmo arquivo da imagem de cima, entao acompanha o
                      // carregamento dela: deixar este preguicoso fazia o Next
                      // avisar que a imagem do LCP estava marcada como adiada,
                      // porque o aviso olha o ARQUIVO.
                      priority={visiveisNoInicio.has(indiceProduto)}
                      draggable={false}
                      className="object-contain object-bottom"
                    />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Veu sobre a esquerda: os que recuam se acumulam atras da ficha,
              e sem isto o texto disputa leitura com eles. So no desktop, que
              e onde ha sobreposicao. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 hidden lg:block"
            style={{
              background:
                "linear-gradient(to right, var(--palco-fundo) 4%, transparent 42%)",
            }}
          />

          {/* ---------------------------------------------------------- */}
          {/* A ficha do aparelho em foco                                 */}
          {/* ---------------------------------------------------------- */}
          <Ficha
            produto={emFoco}
            whatsapp={whatsapp}
            indice={focoNaLista}
            total={total}
            aoIr={irParaAparelho}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * A coluna da esquerda: o que o profissional compara antes de decidir.
 *
 * Cada linha so aparece se tiver conteudo. Cadastro pela metade nao deixa
 * buraco na tela — e o comprimento de onda, que e nulo em radiofrequencia e
 * criolipolise, simplesmente nao ocupa lugar.
 */
function Ficha({
  produto,
  whatsapp,
  indice,
  total,
  aoIr,
}: {
  produto: ProdutoPublico;
  whatsapp: string;
  indice: number;
  total: number;
  aoIr: (i: number) => void;
}) {
  const nms = lerComprimentos(produto.comprimento_onda);
  const etiqueta = ETIQUETA_AREA[produto.area];

  const indicacoes = (produto.indicacoes ?? "")
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="relative z-30 pt-10 pb-12 lg:max-w-sm lg:pt-16 lg:pb-0">
      {/* key: troca o bloco a cada aparelho, o que dispara a entrada suave.
          aria-live avisa quem usa leitor de tela que o conteudo mudou. */}
      <div key={produto.id} aria-live="polite" className="animate-in fade-in duration-500">
        {/* Sem rotulo antes do nome: a secao logo acima ja diz "Equipamentos
            em destaque", e repetir aqui so gastaria a primeira linha. */}
        <h3 className="font-heading text-3xl leading-tight font-semibold text-balance sm:text-4xl">
          {produto.nome}
        </h3>

        <dl className="mt-6 text-sm">
          {produto.modelo && (
            <Linha rotulo="Modelo">
              <span className="font-mono">{produto.modelo}</span>
            </Linha>
          )}

          <Linha rotulo="Indicado para">{etiqueta.curto}</Linha>

          {/* O ponto colorido ao lado de cada comprimento de onda e a cor
              REAL daquela luz, pela mesma funcao que pinta o espectro do
              catalogo. Quem ja viu o espectro na home reconhece a cor aqui. */}
          {nms.length > 0 && (
            <Linha rotulo="Comprimento de onda">
              <span className="flex flex-wrap gap-x-3 gap-y-1 sm:justify-end">
                {nms.map((nm) => (
                  <span key={nm} className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full"
                      style={{ background: corDoComprimento(nm) }}
                    />
                    <span className="font-mono tabular-nums">{nm}</span>
                  </span>
                ))}
                <span className="font-mono">nm</span>
              </span>
            </Linha>
          )}

          {indicacoes.length > 0 && (
            <Linha rotulo="Aplicações">
              <span className="grid gap-1">
                {indicacoes.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </span>
            </Linha>
          )}

          <Linha rotulo="Disponibilidade">
            {produto.disponivel ? "Pronta entrega" : "Sob encomenda"}
          </Linha>
        </dl>

        <p className="mt-6 text-lg font-medium">
          {produto.preco_sob_consulta || produto.preco === null
            ? "Sob consulta"
            : formatarMoeda(produto.preco)}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/equipamentos/${produto.slug}`}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-white px-4 text-sm font-medium text-neutral-900 transition hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:outline-none"
          style={{ ["--tw-ring-offset-color" as string]: "var(--palco-fundo)" }}
        >
          Ver ficha completa
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>

        {whatsapp && (
          <a
            href={montarLinkWhatsApp(
              whatsapp,
              mensagemDeEncomenda({ produto: produto.nome }),
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-white/25 px-4 text-sm font-medium transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Falar no WhatsApp
          </a>
        )}
      </div>

      {/* Navegacao por clique, para quem nao vai arrastar. */}
      <div className="mt-8 flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => aoIr(i)}
            aria-label={`Equipamento ${i + 1} de ${total}`}
            aria-current={i === indice ? "true" : undefined}
            className="group focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:outline-none"
            style={{ ["--tw-ring-offset-color" as string]: "var(--palco-fundo)" }}
          >
            <span
              className={`block h-px w-8 transition ${
                i === indice
                  ? "bg-white"
                  : "bg-white/30 group-hover:bg-white/60"
              }`}
            />
          </button>
        ))}
        <span
          className="ml-2 text-[0.6875rem] tracking-[0.16em] uppercase"
          style={{ color: "var(--palco-suave)" }}
        >
          arraste
        </span>
      </div>
    </div>
  );
}

/**
 * Uma linha da ficha.
 *
 * No celular o rotulo fica EM CIMA do valor: lado a lado, "Comprimento de
 * onda" mais "755 / 808 / 1064 nm" nao cabem numa tela estreita. Da largura
 * `sm` em diante volta a duas colunas, que e o que da o ar de ficha tecnica.
 */
function Linha({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid gap-1 border-t py-2.5 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-6"
      style={{ borderColor: "var(--palco-linha)" }}
    >
      <dt
        className="text-[0.6875rem] tracking-[0.16em] uppercase sm:pt-0.5"
        style={{ color: "var(--palco-suave)" }}
      >
        {rotulo}
      </dt>
      <dd className="min-w-0 sm:text-right">{children}</dd>
    </div>
  );
}
