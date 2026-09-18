"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { criarClienteNavegador } from "@/utils/supabase/client";
import { urlDaImagem } from "@/lib/imagens";
import {
  BUCKET_PRODUTOS,
  TAMANHO_MAXIMO_IMAGEM,
  TIPOS_IMAGEM_ACEITOS,
} from "@/lib/constantes";

/**
 * Upload das fotos do equipamento.
 *
 * O arquivo vai do navegador DIRETO para o Supabase Storage, sem passar pela
 * Vercel. Isso importa no plano gratuito: a funcao serverless tem limite de
 * tempo e de tamanho de corpo, e uma foto de 4 MB atravessando ela e
 * desperdicio. Quem autoriza o envio e a policy "admin envia fotos" do bucket,
 * avaliada pelo Supabase com o token do usuario logado.
 *
 * O formulario nao envia arquivo nenhum: envia a lista de CAMINHOS num campo
 * escondido, em JSON. E isso que a Server Action grava na coluna `imagens`.
 */
export function UploadImagens({
  nome = "imagens",
  iniciais = [],
}: {
  nome?: string;
  iniciais?: string[];
}) {
  const [caminhos, setCaminhos] = useState<string[]>(iniciais);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciarEnvio] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function aoEscolher(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(evento.target.files ?? []);
    if (arquivos.length === 0) return;

    setErro(null);

    iniciarEnvio(async () => {
      const supabase = criarClienteNavegador();
      const novos: string[] = [];

      for (const arquivo of arquivos) {
        if (!TIPOS_IMAGEM_ACEITOS.includes(arquivo.type)) {
          setErro(`"${arquivo.name}": use JPG, PNG, WebP ou AVIF.`);
          continue;
        }

        if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
          setErro(
            `"${arquivo.name}" tem mais de 5 MB. Reduza a foto antes de enviar.`,
          );
          continue;
        }

        // Nome unico: duas fotos chamadas "frente.jpg" nao podem se
        // sobrescrever no bucket.
        const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const caminho = `${crypto.randomUUID()}.${extensao}`;

        const { error } = await supabase.storage
          .from(BUCKET_PRODUTOS)
          .upload(caminho, arquivo, { cacheControl: "31536000", upsert: false });

        if (error) {
          setErro(
            error.message.includes("row-level security")
              ? "Seu usuario nao tem permissao para enviar fotos (so admin)."
              : `Falha ao enviar "${arquivo.name}": ${error.message}`,
          );
          continue;
        }

        novos.push(caminho);
      }

      if (novos.length > 0) setCaminhos((atual) => [...atual, ...novos]);

      // Limpa o input para conseguir escolher o mesmo arquivo de novo.
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function remover(caminho: string) {
    setCaminhos((atual) => atual.filter((c) => c !== caminho));

    // Apaga do bucket para nao acumular arquivo orfao ocupando a cota.
    // Se falhar nao tem problema: a foto ja saiu do produto de qualquer jeito.
    void criarClienteNavegador()
      .storage.from(BUCKET_PRODUTOS)
      .remove([caminho]);
  }

  /** Move a foto para a primeira posicao — ela vira a capa do catalogo. */
  function definirCapa(caminho: string) {
    setCaminhos((atual) => [caminho, ...atual.filter((c) => c !== caminho)]);
  }

  return (
    <div className="space-y-3">
      <Label>Fotos do equipamento</Label>

      {/* O valor que a Server Action le. */}
      <input type="hidden" name={nome} value={JSON.stringify(caminhos)} />

      {caminhos.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {caminhos.map((caminho, i) => {
            const url = urlDaImagem(caminho);
            if (!url) return null;

            return (
              <li
                key={caminho}
                className={cn(
                  "group bg-muted relative aspect-square overflow-hidden rounded-lg border",
                  i === 0 && "ring-primary ring-2 ring-offset-2",
                )}
              >
                <Image
                  src={url}
                  alt={`Foto ${i + 1}`}
                  fill
                  sizes="150px"
                  className="object-cover"
                />

                {i === 0 && (
                  <span className="bg-primary text-primary-foreground absolute bottom-0 w-full py-0.5 text-center text-[10px] font-medium">
                    Capa
                  </span>
                )}

                <div className="absolute top-1 right-1 flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => definirCapa(caminho)}
                      title="Usar como capa"
                      aria-label="Usar como capa"
                      className="rounded bg-black/60 p-1 text-white hover:bg-black/80"
                    >
                      <Star className="size-3" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remover(caminho)}
                    title="Remover foto"
                    aria-label="Remover foto"
                    className="rounded bg-black/60 p-1 text-white hover:bg-red-600"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          id="arquivo-foto"
          type="file"
          accept={TIPOS_IMAGEM_ACEITOS.join(",")}
          multiple
          onChange={aoEscolher}
          disabled={enviando}
          className="sr-only"
        />

        <Button
          render={<label htmlFor="arquivo-foto" />}
          variant="outline"
          size="sm"
          disabled={enviando}
          className="cursor-pointer"
        >
          {enviando ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Enviando...
            </>
          ) : (
            <>
              <ImagePlus className="size-4" aria-hidden="true" />
              Adicionar fotos
            </>
          )}
        </Button>

        <p className="text-muted-foreground text-xs">
          JPG, PNG, WebP ou AVIF. Ate 5 MB cada. A primeira e a capa.
        </p>
      </div>

      {erro && <p className="text-destructive text-xs">{erro}</p>}
    </div>
  );
}
