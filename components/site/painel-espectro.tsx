"use client";

import { useEffect, useRef } from "react";

/**
 * Movimento do painel de espectro, com GSAP.
 *
 * ---------------------------------------------------------------------------
 * Por que GSAP aqui e motion no resto
 * ---------------------------------------------------------------------------
 * As duas bibliotecas animam, mas resolvem problemas diferentes:
 *
 *   motion  — declarativo, pensado em React. Voce descreve o estado inicial e
 *             o final, e ele cuida do resto. Perfeito para "aparecer ao
 *             entrar na tela", que e o caso dos cards.
 *
 *   GSAP    — imperativo, com linha do tempo. Brilha quando a animacao
 *             precisa ser AMARRADA a rolagem, e nao apenas disparada por ela.
 *
 * Aqui o efeito e amarrado: conforme a pagina rola, o painel sobe um pouco
 * mais devagar que o resto e vai perdendo opacidade. Voltando a rolar para
 * cima, ele desfaz na mesma proporcao — porque o `scrub` liga o progresso da
 * animacao a posicao da barra de rolagem, quadro a quadro. Isso o motion nao
 * faz com a mesma naturalidade.
 *
 * As barras tambem crescem da esquerda uma apos a outra ao carregar, o que
 * reforca a leitura de "escala": do comprimento mais curto ao mais longo.
 *
 * ---------------------------------------------------------------------------
 * Por que o import e dinamico
 * ---------------------------------------------------------------------------
 * `await import("gsap")` so busca a biblioteca quando este componente monta,
 * ou seja, so na home. Quem abre o catalogo ou a pagina de um equipamento nao
 * baixa esses ~25 KB. Num site cujo publico chega pelo Instagram, no 4G, isso
 * importa mais do que parece.
 */
export function PainelEspectro({ children }: { children: React.ReactNode }) {
  const caixaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const caixa = caixaRef.current;
    if (!caixa) return;

    /*
     * Respeita "reduzir movimento" antes de qualquer coisa — inclusive antes
     * de baixar a biblioteca. Quem pediu menos movimento nao deve nem pagar o
     * download.
     */
    const querMenosMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (querMenosMovimento) return;

    let limpar: (() => void) | undefined;
    let cancelado = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      // Se o componente desmontou enquanto a biblioteca baixava, para aqui.
      if (cancelado) return;

      gsap.registerPlugin(ScrollTrigger);

      /*
       * gsap.context agrupa tudo que for criado dentro dele e limita os
       * seletores a esta caixa. Na limpeza, um unico revert() desfaz o
       * conjunto — sem isso, cada troca de pagina deixaria ScrollTriggers
       * antigos vivos, empilhando ate travar a rolagem.
       */
      const contexto = gsap.context(() => {
        // 1. As barras crescem da esquerda, uma apos a outra.
        gsap.from("[data-barra]", {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 0.7,
          stagger: 0.05,
          ease: "power3.out",
        });

        // 2. Parallax amarrado a rolagem.
        gsap.to(caixa, {
          yPercent: -8,
          opacity: 0.85,
          ease: "none",
          scrollTrigger: {
            trigger: caixa,
            // Comeca quando o topo do painel encosta no topo da janela e
            // termina quando o rodape dele sai por cima.
            start: "top top",
            end: "bottom top",
            scrub: 0.4,
          },
        });
      }, caixa);

      limpar = () => contexto.revert();
    })();

    return () => {
      cancelado = true;
      limpar?.();
    };
  }, []);

  return <div ref={caixaRef}>{children}</div>;
}
