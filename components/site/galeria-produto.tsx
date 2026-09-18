"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { urlDaImagem } from "@/lib/imagens";

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
}: {
  imagens: string[];
  nome: string;
}) {
  const [indice, setIndice] = useState(0);

  if (!imagens || imagens.length === 0) {
    return (
      <div className="bg-muted text-muted-foreground flex aspect-4/3 items-center justify-center rounded-xl border">
        <ImageOff className="size-12" aria-hidden="true" />
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
