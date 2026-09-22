"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { urlDaImagem } from "@/lib/imagens";
import { faixaDoEquipamento } from "@/lib/espectro";

/**
 * Galeria de fotos do equipamento.
 *
 * Client Component porque precisa de estado: qual miniatura esta selecionada.
 * Repare que o componente e pequeno de proposito — so a parte interativa
 * vira JavaScript no navegador; o resto da pagina de detalhe continua sendo
 * HTML gerado no servidor.
 */
export function GaleriaProduto({
  imagens,
  nome,
  comprimentoOnda,
}: {
  imagens: string[];
  nome: string;
  /** Usado so quando nao ha foto: vira a imagem do equipamento. */
  comprimentoOnda?: string | null;
}) {
  const [indice, setIndice] = useState(0);

  /*
   * Sem foto, a faixa do espectro ocupa o lugar dela — mesma solucao dos
   * cards do catalogo, para a pagina de detalhe nao destoar. O icone de
   * imagem quebrada que estava aqui dizia ao visitante "este site nao esta
   * pronto", bem no momento em que ele estava decidindo a compra.
   */
  if (!imagens || imagens.length === 0) {
    const faixa = faixaDoEquipamento(comprimentoOnda ?? null);

    return (
      <div
        className="relative flex aspect-4/3 items-end overflow-hidden rounded-xl border"
        style={{ backgroundImage: faixa.degrade }}
      >
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, transparent 0 10px, white 10px 11px)",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="relative p-6">
          {faixa.rotulo ? (
            <>
              <p className="font-mono text-[11px] tracking-widest text-white/70 uppercase">
                Comprimento de onda
              </p>
              <p className="font-heading mt-1 text-4xl leading-none font-semibold text-white tabular-nums">
                {faixa.rotulo}
              </p>
            </>
          ) : (
            <p className="font-heading text-2xl leading-tight font-semibold text-white">
              {nome}
            </p>
          )}
        </div>
      </div>
    );
  }

  const atual = urlDaImagem(imagens[indice]);

  return (
    <div className="space-y-3">
      <div className="bg-muted relative aspect-4/3 overflow-hidden rounded-xl border">
        {atual && (
          <Image
            src={atual}
            alt={`${nome} — foto ${indice + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            className="object-cover"
          />
        )}
      </div>

      {imagens.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {imagens.map((caminho, i) => {
            const miniatura = urlDaImagem(caminho);
            if (!miniatura) return null;

            return (
              <button
                key={caminho}
                type="button"
                onClick={() => setIndice(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === indice}
                className={cn(
                  "bg-muted relative aspect-square overflow-hidden rounded-lg border transition",
                  i === indice
                    ? "ring-primary ring-2 ring-offset-2"
                    : "opacity-70 hover:opacity-100",
                )}
              >
                <Image
                  src={miniatura}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
