"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

/**
 * Transicao entre paginas da vitrine.
 *
 * ---------------------------------------------------------------------------
 * O problema
 * ---------------------------------------------------------------------------
 * Numa aplicacao com App Router a navegacao nao recarrega a pagina: o
 * conteudo e trocado no lugar. Isso e rapido, mas visualmente e um corte
 * seco — o catalogo some e o equipamento aparece no mesmo quadro, sem nada
 * indicar que houve movimento. O olho perde a referencia.
 *
 * ---------------------------------------------------------------------------
 * Como funciona
 * ---------------------------------------------------------------------------
 * A chave (`key`) do elemento animado e o caminho da URL. Quando o caminho
 * muda, o React entende que aquele e OUTRO elemento, o antigo sai e o novo
 * entra — e o motion anima a entrada. E o mesmo mecanismo que faz uma lista
 * reordenar corretamente quando cada item tem sua chave.
 *
 * ---------------------------------------------------------------------------
 * Por que a animacao e discreta
 * ---------------------------------------------------------------------------
 * 8px de deslocamento e 0,25s. Transicao de pagina e diferente de animacao
 * decorativa: ela entra no caminho de quem esta tentando chegar a algum
 * lugar. Longa demais, vira pedagio — a pessoa clica e espera. A medida certa
 * e o suficiente para o olho perceber que houve troca, e nada alem disso.
 *
 * Nao ha animacao de SAIDA de proposito. Ela exigiria segurar a pagina antiga
 * na tela enquanto a nova carrega, o que atrasa a navegacao de verdade, nao
 * so na aparencia.
 */
export function TransicaoPagina({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const semMovimento = useReducedMotion();

  if (semMovimento) return <>{children}</>;

  return (
    <motion.div
      key={caminho}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
