"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
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
 * Tambem da para CLICAR: no aparelho vizinho, de qualquer lado, ou nas setas
 * das pontas. O arraste so assume depois que o dedo anda alguns pixels —
 * antes disso o toque e um clique comum.
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

/**
 * A geometria do corredor, em % da largura do trilho.
 *
 *   foco   — onde fica o aparelho em foco
 *   passo  — espacamento de um passo para a direita
 *   limite — ate onde os que recuam se acumulam, a esquerda
 *
 * Sao duas porque o trilho muda de lugar. No celular a ficha fica EMBAIXO e o
 * trilho tem a largura toda. No desktop a ficha fica ao lado e o trilho ocupa
 * so a parte da direita — antes ele corria por baixo do texto, e os aparelhos
 * que recuavam apareciam atras da ficha, disputando leitura com ela.
 */
type Geometria = { foco: number; passo: number; limite: number };
const GEOMETRIA_ESTREITA: Geometria = { foco: 46, passo: 34, limite: 42 };
const GEOMETRIA_LARGA: Geometria = { foco: 27, passo: 40, limite: 22 };

/**
 * Deslocamento do aparelho `d` passos a frente, em % da largura do trilho.
 *
 * Os dois lados se comportam diferente de proposito:
 *
 *   direita (d >= 0) — passo constante. O proximo entra grande e sai cortado
 *                      pela borda, como quem vem vindo na sua direcao.
 *   esquerda (d < 0) — a distancia SATURA no limite. Os que ficaram para
 *                      tras se amontoam perto do mesmo ponto, que e o que o
 *                      olho entende como "longe". Espalhar em passo constante
 *                      daria uma fila lateral, nao um horizonte.
 *
 * As duas metades se encontram em d = 0 com o mesmo valor e a mesma
 * inclinacao (a derivada de ambas em zero vale `passo`), entao o arraste
 * atravessa o zero sem solavanco.
 */
function posicao(d: number, g: Geometria): number {
  if (d >= 0) return g.passo * d;
  return -g.limite * (1 - Math.exp((d * g.passo) / g.limite));
}

/*
 * Qual geometria vale agora. useSyncExternalStore em vez de useState +
 * useEffect: o media query e um dado de fora do React, e assim o valor ja
 * chega certo no primeiro desenho do cliente. No servidor nao ha janela, e a
 * resposta e a estreita — a mesma que o CSS usa antes do breakpoint `lg`.
 */
const CONSULTA_LARGA = "(min-width: 1024px)";

function assinarLargura(avisar: () => void) {
  const consulta = window.matchMedia(CONSULTA_LARGA);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}

function useTelaLarga() {
  return useSyncExternalStore(
    assinarLargura,
    () => window.matchMedia(CONSULTA_LARGA).matches,
    () => false,
  );
}

/** Quanto o dedo precisa andar para o toque virar arraste, em px. */
const LIMIAR_ARRASTE = 6;

/**
 * Quanto a velocidade do gesto empurra alem de onde o dedo soltou.
 * Em "passos por (passo/ms)": um piparote rapido avanca dois ou tres
 * aparelhos, um arraste lento para onde o dedo parou.
 */
const INERCIA = 180;

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

  /*
   * O gesto mora em refs, nao em estado: eventos de ponteiro chegam mais
   * rapido que o React redesenha, e ler `arrastando` do estado dentro de um
   * handler pode devolver o valor do desenho anterior.
   */
  const gesto = useRef<{
    id: number;
    inicioX: number;
    ultimoX: number;
    ultimoT: number;
    /** Velocidade suavizada, em px/ms. Positiva = dedo indo para a direita. */
    velocidade: number;
    ativo: boolean;
  } | null>(null);

  /** Se o ultimo toque virou arraste, o clique que vem junto e descartado. */
  const arrastou = useRef(false);

  /** Rolagem horizontal do trackpad, acumulada ate virar um passo. */
  const rodinha = useRef({ acumulado: 0, ultimoEvento: 0, ultimoPasso: 0 });

  const larga = useTelaLarga();
  const g = larga ? GEOMETRIA_LARGA : GEOMETRIA_ESTREITA;

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
   * A esquerda vai o que sobra da lista depois do foco e dos dois da
   * direita, para o mesmo aparelho nao aparecer duas vezes na tela. So com
   * tres a repeticao e inevitavel — e ai ela acontece na ponta mais apagada.
   */
  const aDireita = emLaco ? 2 : ultimo;
  const aEsquerda = emLaco
    ? Math.max(1, Math.min(total - 1 - aDireita, 4))
    : ultimo;

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

  /** Um passo do trilho, em px. Acompanha a geometria da tela atual. */
  function passoEmPx() {
    const largura = trilho.current?.clientWidth ?? 1;
    return (largura * g.passo) / 100;
  }

  /*
   * O ponteiro NAO e capturado no toque. Capturar ali fazia o `click` cair na
   * faixa em vez do aparelho, e por isso clicar no vizinho nao funcionava —
   * so arrastar. Agora a captura so acontece quando o dedo passa do limiar:
   * toque parado e clique, toque que anda e arraste.
   */
  function aoPressionar(evento: React.PointerEvent<HTMLDivElement>) {
    if (evento.button !== 0) return; // botao do meio ou direito nao arrasta
    arrastou.current = false;
    gesto.current = {
      id: evento.pointerId,
      inicioX: evento.clientX,
      ultimoX: evento.clientX,
      ultimoT: evento.timeStamp,
      velocidade: 0,
      ativo: false,
    };
  }

  function aoMover(evento: React.PointerEvent<HTMLDivElement>) {
    const atual = gesto.current;
    if (!atual || atual.id !== evento.pointerId) return;

    const dx = evento.clientX - atual.inicioX;

    if (!atual.ativo) {
      if (Math.abs(dx) < LIMIAR_ARRASTE) return;
      atual.ativo = true;
      arrastou.current = true;
      evento.currentTarget.setPointerCapture(evento.pointerId);
      setArrastando(true);
    }

    // Velocidade com media movel: um unico evento atrasado nao vira piparote.
    const dt = Math.max(1, evento.timeStamp - atual.ultimoT);
    const instantanea = (evento.clientX - atual.ultimoX) / dt;
    atual.velocidade = atual.velocidade * 0.6 + instantanea * 0.4;
    atual.ultimoX = evento.clientX;
    atual.ultimoT = evento.timeStamp;

    // Arrastar para a ESQUERDA traz o proximo: dx negativo => avanca.
    setFracao(entre(-dx / passoEmPx(), -2.4, 2.4));
  }

  function aoSoltar(evento: React.PointerEvent<HTMLDivElement>) {
    const atual = gesto.current;
    if (!atual || atual.id !== evento.pointerId) return;
    gesto.current = null;
    if (!atual.ativo) return;

    // Dedo parado antes de soltar nao e piparote, mesmo que tenha corrido antes.
    const parado = evento.timeStamp - atual.ultimoT > 80;
    const velocidade = parado ? 0 : atual.velocidade;

    // Para onde o gesto levaria com a inercia, em passos.
    const lancado = fracao - (velocidade / passoEmPx()) * INERCIA;
    const passos = Math.round(entre(lancado, -3, 3));

    setArrastando(false);
    setFracao(0);
    irPara(indice + passos);
  }

  /*
   * Trackpad: dois dedos para o lado andam o trilho. A rolagem chega em
   * dezenas de eventos pequenos; eles se somam ate valer um passo, e depois
   * ha uma pausa curta para um unico gesto nao atravessar a lista inteira.
   */
  function aoRolar(evento: React.WheelEvent<HTMLDivElement>) {
    if (Math.abs(evento.deltaX) <= Math.abs(evento.deltaY)) return;
    const r = rodinha.current;
    const agora = evento.timeStamp;
    if (agora - r.ultimoEvento > 200) r.acumulado = 0;
    r.ultimoEvento = agora;
    r.acumulado += evento.deltaX;

    if (Math.abs(r.acumulado) > 50 && agora - r.ultimoPasso > 380) {
      irPara(indice + Math.sign(r.acumulado));
      r.acumulado = 0;
      r.ultimoPasso = agora;
    }
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

  const podeVoltar = emLaco || indice > 0;
  const podeAvancar = emLaco || indice < ultimo;

  return (
    <section className="palco border-y">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="relative lg:min-h-[40rem]">
          {/* ---------------------------------------------------------- */}
          {/* O trilho                                                    */}
          {/* ---------------------------------------------------------- */}
          {/*
            No desktop o trilho comeca DEPOIS da coluna da ficha (left-[37%])
            e corta tudo o que tentar passar para a esquerda dela. O corte so
            vale para a esquerda: em cima, embaixo (o reflexo) e a direita o
            clip-path deixa folga, e quem limita ali e a propria secao.
          */}
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
            onWheel={aoRolar}
            onKeyDown={aoTeclar}
            className="palco-bancada relative mb-16 h-[20rem] touch-pan-y overscroll-x-none rounded-sm select-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none sm:h-[26rem] lg:absolute lg:top-16 lg:right-0 lg:left-[37%] lg:mb-0 lg:h-[30rem] lg:[clip-path:inset(-30%_-100vw_-100%_0)]"
            style={{ cursor: arrastando ? "grabbing" : "grab" }}
          >
            {/* A poca de luz na bancada, embaixo do aparelho aceso. */}
            <div
              aria-hidden="true"
              className="poca"
              style={
                {
                  left: `calc(${g.foco}% + ${posicao(indice - alvo, g)}%)`,
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

              // No desktop os que recuam somem mais depressa: ali eles ficam
              // atras do aparelho em foco, e o que sobra deles e so a sugestao
              // de fila, nao mais um aparelho para ler.
              const opacidade =
                larga && d < 0
                  ? entre(1 + d * 0.55, 0, 1)
                  : entre(1.15 - Math.abs(d) * 0.22, 0, 1);

              return (
                <button
                  // A chave e a POSICAO no trilho, nao o id do produto: com o
                  // laco o mesmo aparelho reaparece em outra posicao, e usar o
                  // id faria o React embaralhar os elementos no meio da
                  // animacao em vez de deixar cada um seguir o seu caminho.
                  key={k}
                  type="button"
                  onClick={() => {
                    // O clique que encerra um arraste nao e escolha de aparelho.
                    if (arrastou.current) {
                      arrastou.current = false;
                      return;
                    }
                    irPara(k);
                  }}
                  aria-label={`Ver ${produto.nome}`}
                  aria-current={k === indice ? "true" : undefined}
                  tabIndex={-1}
                  className={`peca ${aceso ? "" : "peca-apagada"} aspect-[2/3] h-full`}
                  style={{
                    left: `calc(${g.foco}% + ${posicao(d, g)}%)`,
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
                    opacity: opacidade,
                    // Peca invisivel nao pode roubar clique de quem esta atras.
                    pointerEvents: opacidade < 0.15 ? "none" : undefined,
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

          {/* Veu na borda esquerda do trilho: o corte do clip-path vira um
              esmaecimento, em vez de uma linha reta atravessando o aparelho
              que recua. So no desktop, que e onde ha corte. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 hidden lg:block"
            style={{
              background:
                "linear-gradient(to right, var(--palco-fundo) 36%, transparent 44%)",
            }}
          />

          {/* Setas nas duas pontas, por cima do veu. Ficam FORA do trilho
              porque o clip-path dele cria um contexto de empilhamento: dentro,
              a seta da esquerda ficaria embaixo do veu, apagada. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-[20rem] items-center justify-between sm:h-[26rem] lg:top-16 lg:right-0 lg:left-[37%] lg:h-[30rem]">
            <Seta
              direcao="anterior"
              aoClicar={() => irPara(indice - 1)}
              desativada={!podeVoltar}
            />
            <Seta
              direcao="proximo"
              aoClicar={() => irPara(indice + 1)}
              desativada={!podeAvancar}
            />
          </div>

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

/** Seta de navegacao numa das pontas do trilho. */
function Seta({
  direcao,
  aoClicar,
  desativada,
}: {
  direcao: "anterior" | "proximo";
  aoClicar: () => void;
  desativada: boolean;
}) {
  const Icone = direcao === "anterior" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={desativada}
      aria-label={
        direcao === "anterior" ? "Equipamento anterior" : "Proximo equipamento"
      }
      className="pointer-events-auto flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-0"
    >
      <Icone className="size-5" aria-hidden="true" />
    </button>
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
          arraste ou clique
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
