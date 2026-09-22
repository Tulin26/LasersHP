"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Revela um bloco com um leve deslocamento.
 *
 * Existe em duas variantes, e a diferenca importa:
 *
 *   `aoCarregar` — anima assim que a pagina monta. Para o que ja esta visivel
 *     quando o site abre, como o titulo do heroi. Esperar rolagem para animar
 *     algo que ja esta na tela deixaria o conteudo invisivel por nada.
 *
 *   padrao — anima quando o bloco entra na tela. Para o que esta mais abaixo.
 *
 * O `atraso` permite encadear: titulo, depois subtitulo, depois botoes. Esse
 * encadeamento nao e enfeite — ele conduz o olho na ordem de leitura, em vez
 * de despejar tudo de uma vez e deixar a pessoa escolher por onde comecar.
 *
 * Como os filhos chegam prontos por `children`, o conteudo continua vindo do
 * servidor: este arquivo so cuida do movimento.
 */
export function Revelar({
  children,
  atraso = 0,
  aoCarregar = false,
  className,
}: {
  children: React.ReactNode;
  /** Segundos de espera antes de comecar. */
  atraso?: number;
  /** true anima na montagem; false espera entrar na tela. */
  aoCarregar?: boolean;
  className?: string;
}) {
  const semMovimento = useReducedMotion();

  if (semMovimento) return <div className={className}>{children}</div>;

  const inicial = { opacity: 0, y: 14 };
  const final = { opacity: 1, y: 0 };
  const transicao = {
    duration: 0.5,
    delay: atraso,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  if (aoCarregar) {
    return (
      <motion.div
        initial={inicial}
        animate={final}
        transition={transicao}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={inicial}
      whileInView={final}
      /* Margem positiva embaixo: dispara ANTES de o bloco entrar na tela,
         para ele ja estar pronto quando chegar na altura dos olhos. */
      viewport={{ once: true, margin: "0px 0px 200px 0px" }}
      transition={transicao}
      className={className}
    >
      {children}
    </motion.div>
  );
}
