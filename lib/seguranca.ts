import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { exigirVariavel } from "@/lib/ambiente";

/**
 * Identificadores anonimos para contagem de tentativas.
 *
 * Duas coisas precisam ser contadas no sistema: quantos pedidos vieram do
 * mesmo visitante (freio de spam na vitrine) e quantas senhas erradas vieram
 * da mesma origem (freio de forca bruta no login). As duas precisam
 * RECONHECER alguem sem IDENTIFICAR ninguem.
 *
 * O hash resolve isso: a mesma entrada sempre da o mesmo resultado, entao da
 * para contar; mas nao existe caminho de volta do hash para o IP ou para o
 * e-mail. Guardar IP em texto puro seria dado pessoal (LGPD) sem necessidade
 * nenhuma, ja que nunca precisamos saber QUAL e o IP.
 *
 * `import "server-only"` no topo: se algum componente de navegador importar
 * este arquivo por engano, o build quebra em vez de mandar o tempero junto.
 */

/**
 * O tempero (salt).
 *
 * Sem ele, sha256("189.1.2.3") e sempre o mesmo valor no mundo inteiro: quem
 * conseguisse ler a tabela poderia gerar o hash de todos os IPv4 que existem
 * e descobrir de quem era cada linha. Com um tempero secreto misturado, essa
 * tabela de consulta teria que ser refeita — e so quem tem o tempero
 * consegue.
 *
 * Fica numa variavel propria, e nao na SUPABASE_SECRET_KEY, porque sao coisas
 * com ciclos de vida diferentes: a chave do Supabase deve ser trocada de
 * tempos em tempos, e se ela fosse o tempero, cada troca invalidaria todos os
 * hashes gravados e zeraria os dois freios de uma vez.
 */
function tempero(): string {
  return exigirVariavel(
    process.env.SALT_HASH_IP ?? process.env.SUPABASE_SECRET_KEY,
    "SALT_HASH_IP",
  );
}

/** Hash estavel de um texto qualquer (ex.: o e-mail digitado no login). */
export function hashDeTexto(valor: string): string {
  return createHash("sha256")
    .update(`${tempero()}:${valor.trim().toLowerCase()}`)
    .digest("hex");
}

/**
 * Hash do IP de quem esta fazendo a requisicao agora.
 *
 * Na Vercel o IP real chega no cabecalho `x-forwarded-for`: o primeiro da
 * lista e o visitante, os seguintes sao os proxies pelo caminho. Esse
 * cabecalho pode ser forjado por quem fala direto com o servidor, mas na
 * Vercel ele e reescrito na borda, entao o primeiro valor e confiavel.
 */
export async function hashDoIP(): Promise<string> {
  const cabecalhos = await headers();

  const ip =
    cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    cabecalhos.get("x-real-ip") ||
    "desconhecido";

  return hashDeTexto(ip);
}
