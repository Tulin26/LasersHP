"use client";

import { Children } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Entrada em cascata dos cards.
 *
 * ---------------------------------------------------------------------------
 * Por que um Client Component aqui, se o resto da vitrine e servidor
 * ---------------------------------------------------------------------------
 * Animacao precisa de JavaScript rodando no navegador, entao este arquivo
 * leva "use client". Mas repare no que ele NAO faz: nao busca dado, nao sabe
 * o que e um produto, nao renderiza card nenhum.
 *
 * Os cards chegam prontos pela prop `children`. Quando um Server Component
 * passa JSX ja renderizado para um Client Component, esse JSX CONTINUA sendo
 * do servidor — o navegador recebe o HTML pronto e o cliente so cuida do
 * movimento. E por isso que a pagina continua aparecendo inteira para o
 * Google e para quem esta sem JavaScript.
 *
 * ---------------------------------------------------------------------------
 * Sobre o movimento
 * ---------------------------------------------------------------------------
 * A regra que separa animacao boa de enjoativa: ela existe para explicar
 * uma relacao, nao para chamar atencao. Aqui o atraso crescente entre os
 * cards conta ao olho que aquilo e uma LISTA, com ordem — e nao um monte de
 * blocos que apareceram juntos. Por isso o deslocamento e curto (12px) e o
 * tempo, curto (0,4s): perceptivel, nunca uma espera.
 *
 * `whileInView` com `once` dispara quando o bloco entra na tela, uma vez so.
 * Reanimar a cada rolagem irrita rapido.
 */
export function ListaAnimada({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  /*
   * Quem marcou "reduzir movimento" no sistema tem motivo: enxaqueca,
   * sensibilidade vestibular, enjoo. O motion le essa preferencia do
   * navegador e devolve `true` aqui. Nesse caso o conteudo aparece sem
   * deslocamento nenhum — some a animacao, nao o conteudo.
   */
  const semMovimento = useReducedMotion();

  const itens = Children.toArray(children);

  return (
    <div className={className}>
      {itens.map((filho, indice) => (
        <motion.div
          key={indice}
          initial={semMovimento ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          /*
           * A margem aqui funciona como o rootMargin do IntersectionObserver:
           * valor POSITIVO estica a area de observacao para fora da tela, e o
           * disparo acontece ANTES de o card entrar.
           *
           * Antes estava "-40px", que faz o contrario — exige o card 40px
           * dentro da tela para so entao comecar a animar. No celular, onde os
           * cards ficam empilhados um por linha, o resultado media era um vao
           * em branco: o segundo e o terceiro card continuavam invisiveis
           * enquanto o visitante ja olhava para o lugar deles.
           *
           * Com 240px de folga embaixo, cada card ja terminou de aparecer
           * quando chega na altura dos olhos.
           */
          viewport={{ once: true, margin: "0px 0px 240px 0px" }}
          transition={{
            duration: 0.4,
            // Teto de 6 posicoes: numa lista de 30 equipamentos, o ultimo
            // levaria 1,5s para aparecer, o que vira espera em vez de efeito.
            delay: Math.min(indice, 6) * 0.06,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {filho}
        </motion.div>
      ))}
    </div>
  );
}
