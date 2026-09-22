"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { capaDoProduto } from "@/lib/imagens";
import { formatarMoeda } from "@/lib/formatar";
import { montarLinkWhatsApp, mensagemDeEncomenda } from "@/lib/whatsapp";
import type { Produto } from "@/lib/tipos/database.types";

/**
 * O trilho de aparelhos da home.
 *
 * E um Client Component ("use client") porque precisa de estado e de eventos
 * de ponteiro — arrastar com o dedo ou com o mouse. Os DADOS continuam vindo
 * do servidor: a pagina busca no banco e passa a lista pronta por props. Ou
 * seja, o JavaScript que desce para o navegador e so o da interacao.
 *
 * COMO A PERSPECTIVA E FEITA
 * Nao usa 3D de verdade. Cada aparelho recebe uma posicao e um tamanho
 * calculados a partir da DISTANCIA ate o aparelho em foco:
 *
 *     d = indice do aparelho - indice em foco
 *
 * O tamanho cresce em PROGRESSAO GEOMETRICA com d (cada passo para a direita
 * e ~24% maior que o anterior). Isso produz o efeito de corredor: os aparelhos
 * vem se aproximando da esquerda, se acumulando no horizonte, e saem grandes
 * pela direita.
 *
 * O trilho da a volta: `d` e calculado a partir de um contador sem fim, e o
 * aparelho de cada posicao sai do resto da divisao pelo tamanho do catalogo.
 *
 * Todos apoiam na mesma linha porque a escala parte da base
 * (`transform-origin: bottom center`, no globals.css). E a mesma foto que a
 * DMC faz dos quatro enfileirados sobre a mesa.
 */

const entre = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Quanto cada passo para a direita aumenta o aparelho. */
const PASSO_ESCALA = 1.24;

/**
 * Tamanho do aparelho em foco, em fracao da altura do trilho.
 * Sobra espaco de proposito: o proximo aparelho e MAIOR que o em foco, e
 * precisa caber sem ter a cabeca cortada — aparelho decapitado parece defeito,
 * diferente de um disco cortado na borda, que e o que a A24 faz.
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
 *   direita (d >= 0) — passo constante. O proximo aparelho entra grande e sai
 *                      cortado pela borda, como quem vem vindo na sua direcao.
 *   esquerda (d < 0) — a distancia SATURA em LIMITE_X. Os aparelhos que ficaram
 *                      para tras se amontoam perto do mesmo ponto, que e o que
 *                      o olho entende como "longe". Espalhar em passo constante
 *                      daria uma fila lateral, nao um horizonte.
 *
 * As duas metades se encontram em d = 0 com o MESMO valor e a MESMA inclinacao
 * (a derivada de ambas em zero vale PASSO_X). Por isso o arraste atravessa o
 * zero sem solavanco.
 */
function posicao(d: number): number {
  if (d >= 0) return PASSO_X * d;
  return -LIMITE_X * (1 - Math.exp((d * PASSO_X) / LIMITE_X));
}

function escala(d: number): number {
  // O teto de 0,98 e o que impede o aparelho da borda direita de ter a cabeca
  // cortada pelo topo do trilho. Ele ainda entra maior que o em foco — a
  // sensacao de "vindo na sua direcao" continua —, so nao passa da altura util.
  return entre(TAMANHO_FOCO * Math.pow(PASSO_ESCALA, d), 0.1, 0.98);
}

export function TrilhoLasers({
  produtos,
  whatsapp,
}: {
  produtos: Produto[];
  whatsapp: string;
}) {
  const total = produtos.length;

  /**
   * O trilho da a volta quando ha aparelhos suficientes.
   *
   * Com o laco ligado, `indice` deixa de ser a posicao dentro do array e vira
   * um contador que cresce (ou diminui) para sempre: 0, 1, 2, 3, 4, 5... O
   * aparelho de cada posicao sai de `emPosicao()`, que traz o contador de
   * volta para dentro do array. Assim nao existe "fim do trilho" — a direita
   * nunca fica vazia.
   *
   * Abaixo de tres aparelhos o laco fica desligado: com um ou dois, a volta
   * mostraria o mesmo aparelho duas vezes na tela ao mesmo tempo, o que
   * parece defeito, nao continuidade.
   */
  const emLaco = total >= 3;

  // Comeca no segundo aparelho: assim ja ha um recuando a esquerda e outros
  // chegando pela direita. Comecar no primeiro deixaria metade da tela vazia.
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
   * Quantos aparelhos aparecem de cada lado do que esta em foco.
   *
   * Sao DOIS a direita porque o segundo entra cortado pela borda: e ele que
   * faz o trilho parecer continuar para fora da tela. Com so um, o canto
   * direito fica vazio e a sensacao de corredor morre.
   *
   * A esquerda o limite e o tamanho do catalogo menos dois, para o mesmo
   * aparelho nao aparecer duas vezes em tamanho legivel. Com quatro
   * aparelhos isso da uma janela de cinco posicoes, e a unica repeticao —
   * a ultima da direita — cai fora da tela. E para em quatro de qualquer
   * forma, porque dali em diante eles ja estao pequenos e empilhados.
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
   * Quais aparelhos ja estao na tela no primeiro desenho.
   *
   * Sao esses que precisam carregar sem esperar: um deles vai ser o LCP da
   * home, e imagem adiada ali atrasa a primeira impressao. Nao da para usar
   * "os tres primeiros do catalogo": com o laco, a posicao a esquerda do
   * inicio ja mostra o ULTIMO aparelho. Entao a conta e feita com a mesma
   * janela do trilho, a partir da posicao inicial.
   *
   * Depende so do tamanho do catalogo, entao nao muda enquanto o trilho gira.
   */
  const visiveisNoInicio = new Set<number>();
  for (let k = indiceInicial - aEsquerda; k <= indiceInicial + aDireita; k++) {
    if (!emLaco && (k < 0 || k > ultimo)) continue;
    visiveisNoInicio.add(((k % total) + total) % total);
  }

  function irPara(novo: number) {
    setIndice(emLaco ? novo : entre(novo, 0, ultimo));
  }

  /** Qual aparelho do catalogo esta em foco agora (0..total-1). */
  const focoNoCatalogo = ((indice % total) + total) % total;

  /**
   * Vai para um aparelho escolhido nos tracinhos, pelo caminho mais curto.
   *
   * Sem isso, estando no ultimo e clicando no primeiro, o trilho giraria o
   * catalogo inteiro para tras em vez de dar um passo a frente.
   */
  function irParaAparelho(i: number) {
    if (!emLaco) return irPara(i);
    let passos = i - focoNoCatalogo;
    if (passos > total / 2) passos -= total;
    if (passos < -total / 2) passos += total;
    irPara(indice + passos);
  }

  function aoPressionar(evento: React.PointerEvent<HTMLDivElement>) {
    // Botao do meio ou direito nao arrasta.
    if (evento.button !== 0) return;
    inicioX.current = evento.clientX;
    setArrastando(true);
    evento.currentTarget.setPointerCapture(evento.pointerId);
  }

  function aoMover(evento: React.PointerEvent<HTMLDivElement>) {
    if (!arrastando) return;
    const largura = trilho.current?.clientWidth ?? 1;
    // Um passo equivale a ~30% da largura, que e o espacamento da progressao.
    const passo = largura * 0.3;
    // Arrastar para a ESQUERDA traz o proximo aparelho: dx negativo => avanca.
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

  if (produtos.length === 0) return null;

  return (
    <section className="palco">
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="relative lg:min-h-[44rem]">
          {/* ---------------------------------------------------------- */}
          {/* O trilho                                                    */}
          {/* ---------------------------------------------------------- */}
          <div
            ref={trilho}
            role="group"
            aria-label="Aparelhos em destaque"
            aria-roledescription="carrossel"
            tabIndex={0}
            onPointerDown={aoPressionar}
            onPointerMove={aoMover}
            onPointerUp={aoSoltar}
            onPointerCancel={aoSoltar}
            onKeyDown={aoTeclar}
            className="bancada focus-visible:ring-ring relative mb-20 h-[22rem] touch-pan-y rounded-sm select-none focus-visible:ring-2 focus-visible:outline-none sm:h-[28rem] lg:absolute lg:inset-x-0 lg:top-16 lg:mb-0 lg:h-[34rem]"
            style={{ cursor: arrastando ? "grabbing" : "grab" }}
          >
            {/* A poca de luz vermelha na bancada, embaixo do aparelho aceso */}
            <div
              aria-hidden="true"
              className="poca"
              style={{
                left: `calc(${FOCO}% + ${posicao(indice - alvo)}%)`,
                opacity: arrastando ? 0.45 : 1,
              }}
            />

            {posicoes.map((k) => {
              const produto = emPosicao(k);
              const d = k - alvo;
              const capa = capaDoProduto(produto.imagens);
              const aceso = k === indice && !arrastando;
              if (!capa) return null;

              // Indice real dentro do catalogo, usado para decidir o que
              // carrega antes. E uma propriedade do ARQUIVO, nao da posicao:
              // nao pode mudar conforme o trilho gira, senao o navegador
              // ficaria repriorizando imagem ja baixada.
              const indiceProduto = ((k % total) + total) % total;
              const carregaAgora = visiveisNoInicio.has(indiceProduto);

              return (
                <button
                  // A chave e a POSICAO no trilho, nao o id do produto: com o
                  // laco ligado o mesmo aparelho reaparece em outra posicao, e
                  // usar o id faria o React embaralhar os elementos no meio da
                  // animacao em vez de deixar cada um seguir o seu caminho.
                  key={k}
                  type="button"
                  onClick={() => irPara(k)}
                  aria-label={`Ver ${produto.nome}`}
                  aria-current={k === indice ? "true" : undefined}
                  tabIndex={-1}
                  /* A caixa tem a proporcao da tela em que os recortes foram
                     gravados (1000x1500). Como os quatro arquivos tem o mesmo
                     tamanho de tela, e cada aparelho ocupa dentro dela a altura
                     que tem de verdade em relacao aos outros, a diferenca de
                     porte aparece sozinha: o E-LIB, de pulso, nao fica do
                     tamanho de uma caneta de 20 cm. */
                  className={`peca ${aceso ? "peca-acesa" : "peca-apagada"} aspect-[2/3] h-full`}
                  style={{
                    left: `calc(${FOCO}% + ${posicao(d)}%)`,
                    transform: `translateX(-50%) scale(${escala(d)})`,
                    // Durante o arraste a peca acompanha o dedo, sem suavizar.
                    transition: arrastando ? "none" : undefined,
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
                      // Os tres primeiros ja estao na tela quando a pagina
                      // abre (o trilho comeca no segundo aparelho). Carregar
                      // sob demanda faria um deles ser o LCP e atrasaria a
                      // primeira impressao da home.
                      priority={carregaAgora}
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
                      // carregamento dela. Deixar este preguicoso fazia o Next
                      // avisar que a imagem do LCP estava marcada como adiada:
                      // o aviso olha o ARQUIVO, e o reflexo usa o mesmo.
                      priority={carregaAgora}
                      draggable={false}
                      className="object-contain object-bottom"
                    />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Veu escuro sobre a esquerda do trilho. Os aparelhos que recuam
              se acumulam justamente atras da ficha; sem isto o texto disputa
              leitura com eles. So no desktop, onde ha sobreposicao. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 hidden lg:block"
            style={{
              background:
                "linear-gradient(to right, var(--noite) 4%, transparent 42%)",
            }}
          />

          {/* ---------------------------------------------------------- */}
          {/* A ficha do aparelho em foco                                 */}
          {/* ---------------------------------------------------------- */}
          <FichaDoAparelho
            produto={emFoco}
            whatsapp={whatsapp}
            indice={focoNoCatalogo}
            total={total}
            aoIr={irParaAparelho}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * A coluna da esquerda.
 *
 * E o lugar onde a A24 poe diretor, ano e elenco do filme. Aqui recebe o que
 * o profissional de fato compara antes de comprar. Cada linha so aparece se
 * tiver conteudo: cadastro pela metade nao deixa buraco na tela.
 */
function FichaDoAparelho({
  produto,
  whatsapp,
  indice,
  total,
  aoIr,
}: {
  produto: Produto;
  whatsapp: string;
  indice: number;
  total: number;
  aoIr: (i: number) => void;
}) {
  const indicacoes = (produto.indicacoes ?? "")
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean)
    .slice(0, 4);

  const emissoes = [
    produto.emite_vermelho && { texto: "Vermelho", cor: "var(--feixe)" },
    produto.emite_infravermelho && {
      texto: "Infravermelho",
      cor: "var(--infra)",
    },
  ].filter(Boolean) as { texto: string; cor: string }[];

  return (
    <div className="relative z-30 pt-8 pb-10 lg:max-w-sm lg:pt-16 lg:pb-0">
      {/* key: troca o bloco a cada aparelho, o que dispara a entrada suave.
          aria-live avisa quem usa leitor de tela que o conteudo mudou. */}
      <div key={produto.id} aria-live="polite">
        <h1 className="gravado text-2xl leading-none text-balance sm:text-3xl lg:text-4xl">
          {produto.nome}
        </h1>

        <dl className="mt-6 text-sm">
          {produto.modelo && (
            <Linha rotulo="Fabricante">{produto.modelo}</Linha>
          )}

          {produto.aplicacao && (
            <Linha rotulo="Aplicacao">{produto.aplicacao}</Linha>
          )}

          {/* Emissao, comprimento de onda e potencia ficam juntos: os tres
              falam da mesma coisa, que e a luz que o aparelho entrega. */}
          {emissoes.length > 0 && (
            <Linha rotulo="Emissao">
              <span className="grid gap-1">
                {emissoes.map((e) => (
                  <span
                    key={e.texto}
                    className="flex items-center gap-2 sm:justify-end"
                  >
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full"
                      style={{ background: e.cor }}
                    />
                    {e.texto}
                  </span>
                ))}
              </span>
            </Linha>
          )}

          {produto.comprimento_onda && (
            <Linha rotulo="Comprimento de onda">
              <span className="font-mono">{produto.comprimento_onda}</span>
            </Linha>
          )}

          {produto.potencia && (
            <Linha rotulo="Potencia">
              <span className="font-mono">{produto.potencia}</span>
            </Linha>
          )}

          {indicacoes.length > 0 && (
            <Linha rotulo="Indicado para">
              <span className="grid gap-1">
                {indicacoes.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </span>
            </Linha>
          )}
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
          className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-sm font-medium transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--noite)] focus-visible:outline-none"
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
            className="border-border focus-visible:ring-ring inline-flex h-10 items-center gap-1.5 rounded-md border px-4 text-sm font-medium transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--noite)] focus-visible:outline-none"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Falar no WhatsApp
          </a>
        )}
      </div>

      {/* Navegacao por teclado e clique, para quem nao vai arrastar. */}
      <div className="mt-8 flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => aoIr(i)}
            aria-label={`Aparelho ${i + 1} de ${total}`}
            aria-current={i === indice ? "true" : undefined}
            className="focus-visible:ring-ring group focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--noite)] focus-visible:outline-none"
          >
            <span
              className={`block h-px w-8 transition ${
                i === indice
                  ? "bg-[var(--osso)]"
                  : "bg-[var(--titanio)]/35 group-hover:bg-[var(--titanio)]/70"
              }`}
            />
          </button>
        ))}
        <span className="rotulo ml-2">arraste</span>
      </div>
    </div>
  );
}

/**
 * Uma linha da ficha.
 *
 * No celular o rotulo fica EM CIMA do valor. Lado a lado, "INDICADO PARA" mais
 * "Areas superficiais e profundas" nao cabem em 390px: a linha estoura e
 * arrasta a pagina inteira para o lado. Da largura `sm` em diante volta ao
 * formato de duas colunas, que e o que da o ar de ficha tecnica.
 */
function Linha({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border grid gap-1 border-t py-2.5 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-6">
      <dt className="rotulo sm:pt-0.5">{rotulo}</dt>
      <dd className="min-w-0 sm:text-right">{children}</dd>
    </div>
  );
}
