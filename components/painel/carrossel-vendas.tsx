"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EtiquetaStatusVenda } from "@/components/painel/ui-painel";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import type { VendaResumida } from "@/lib/consultas/painel";

/**
 * Carrossel das ultimas vendas.
 *
 * Nao tem biblioteca de carrossel aqui, e de proposito. O que faz a faixa
 * deslizar e CSS puro:
 *   - `overflow-x-auto`  -> cria a rolagem horizontal
 *   - `snap-x snap-mandatory` + `snap-start` -> os cards param alinhados em
 *     vez de ficarem cortados pela metade
 *
 * Com isso o arrastar no celular ja funciona sem uma linha de JavaScript.
 * O React entra so para as setas do computador, onde nao existe o gesto de
 * arrastar. Uma biblioteca de carrossel aqui adicionaria uns 15 KB ao painel
 * para fazer o que o navegador ja faz nativamente.
 */
export function CarrosselVendas({ vendas }: { vendas: VendaResumida[] }) {
  const faixaRef = useRef<HTMLUListElement>(null);

  // Quando a faixa esta no comeco, nao ha para onde voltar.
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);

  /**
   * Decide quais setas fazem sentido, olhando a posicao real da rolagem.
   *
   * A folga de 8px evita que a seta pisque no fim da rolagem por causa de
   * arredondamento de subpixel.
   */
  const medir = useCallback(() => {
    const faixa = faixaRef.current;
    if (!faixa) return;

    const fim = faixa.scrollWidth - faixa.clientWidth;
    setPodeVoltar(faixa.scrollLeft > 8);
    setPodeAvancar(faixa.scrollLeft < fim - 8);
  }, []);

  /*
   * Ref de callback em vez de useEffect para a medicao inicial.
   *
   * O React chama esta funcao assim que o <ul> entra no DOM — momento em que
   * scrollWidth e clientWidth ja existem. Contar card ("se tiver mais de 3,
   * da para rolar") seria um chute: quatro cards cabem numa tela larga e nao
   * cabem numa estreita. Aqui a pergunta e respondida pelo proprio layout.
   */
  const montarFaixa = useCallback(
    (elemento: HTMLUListElement | null) => {
      faixaRef.current = elemento;
      if (elemento) medir();
    },
    [medir],
  );

  /*
   * Girar o tablet ou redimensionar a janela muda o que cabe na tela, e a
   * rolagem nao dispara sozinha nesse caso. Este e o uso legitimo de efeito:
   * assinar um evento de fora do React e cancelar a assinatura na saida.
   */
  useEffect(() => {
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [medir]);

  function deslizar(direcao: -1 | 1) {
    const faixa = faixaRef.current;
    if (!faixa) return;

    // Rola aproximadamente uma tela de cada vez, respeitando a preferencia
    // de quem desativou animacoes no sistema.
    const prefereMenosMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    faixa.scrollBy({
      left: direcao * faixa.clientWidth * 0.8,
      behavior: prefereMenosMovimento ? "auto" : "smooth",
    });
  }

  if (vendas.length === 0) {
    return (
      <p className="text-muted-foreground mt-3 text-sm">
        Nenhuma venda registrada ainda.{" "}
        <Link
          href="/admin/vendas/nova"
          className="text-primary hover:underline"
        >
          Registrar a primeira
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="relative mt-3">
      <ul
        ref={montarFaixa}
        onScroll={medir}
        tabIndex={0}
        role="region"
        aria-label="Ultimas vendas registradas"
        className="focus-visible:ring-ring flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 focus-visible:ring-2 focus-visible:outline-none [scrollbar-width:thin]"
      >
        {vendas.map((venda) => (
          <li key={venda.id} className="w-56 shrink-0 snap-start sm:w-64">
            <Link
              href={`/admin/vendas/${venda.id}`}
              className="hover:border-primary/50 focus-visible:ring-ring block h-full rounded-xl border p-3 transition hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">
                  {formatarData(venda.data)}
                </span>
                <EtiquetaStatusVenda status={venda.status} />
              </div>

              <p className="mt-2 truncate font-medium" title={venda.cliente}>
                {venda.cliente}
              </p>

              <p
                className="text-muted-foreground mt-0.5 truncate text-xs"
                title={venda.itens}
              >
                {venda.itens}
              </p>

              <p
                className={
                  venda.status === "cancelado"
                    ? "text-muted-foreground mt-3 text-lg font-semibold line-through"
                    : "mt-3 text-lg font-semibold"
                }
              >
                {formatarMoeda(venda.total)}
              </p>

              <p className="text-muted-foreground mt-0.5 truncate text-xs">
                {venda.vendedor}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {/*
        Setas so no computador (`hidden md:flex`): no celular o gesto de
        arrastar resolve, e as setas so roubariam espaco da tela.
        aria-hidden porque a faixa ja e navegavel pelo teclado com Tab +
        setas — para quem usa leitor de tela, estes botoes seriam ruido.
      */}
      <div className="pointer-events-none absolute inset-y-0 -left-2 -right-2 hidden items-center justify-between md:flex">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => deslizar(-1)}
          disabled={!podeVoltar}
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-auto rounded-full shadow-sm disabled:opacity-0"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => deslizar(1)}
          disabled={!podeAvancar}
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-auto rounded-full shadow-sm disabled:opacity-0"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
