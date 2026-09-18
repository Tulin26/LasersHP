import { BUCKET_PRODUTOS } from "@/lib/constantes";

/**
 * Monta a URL publica de uma foto guardada no Supabase Storage.
 *
 * O bucket "produtos" e publico, entao a URL segue sempre o mesmo padrao e
 * da para montar na mao — sem precisar de uma chamada de rede so para
 * descobrir o endereco da imagem. Isso importa: a listagem do catalogo tem
 * dezenas de fotos, e uma ida ao Supabase por foto deixaria a pagina lenta.
 *
 * No banco guardamos apenas o caminho relativo ("abc123/frente.webp").
 * Guardar a URL inteira seria pior: se o projeto Supabase mudar de endereco,
 * todas as linhas do banco precisariam ser reescritas.
 */
export function urlDaImagem(caminho: string | null | undefined): string | null {
  if (!caminho) return null;

  // Ja veio uma URL completa (ex.: imagem de OG apontando para outro lugar).
  if (caminho.startsWith("http://") || caminho.startsWith("https://")) {
    return caminho;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  return `${base}/storage/v1/object/public/${BUCKET_PRODUTOS}/${caminho}`;
}

/** Foto de capa = primeira posicao do array `imagens`. */
export function capaDoProduto(
  imagens: string[] | null | undefined,
): string | null {
  if (!imagens || imagens.length === 0) return null;
  return urlDaImagem(imagens[0]);
}
