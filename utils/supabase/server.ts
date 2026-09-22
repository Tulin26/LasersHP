import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/tipos/database.types";
import { exigirVariavel } from "@/lib/ambiente";

/**
 * Cliente do Supabase para codigo que roda no SERVIDOR: Server Components,
 * Server Actions e Route Handlers.
 *
 * Usa a chave publicavel (a mesma do navegador) de proposito — assim o RLS
 * continua valendo e cada consulta enxerga apenas o que o usuario logado
 * pode ver. A sessao vem dos cookies da requisicao.
 *
 * E `async` porque no Next 16 o `cookies()` passou a ser assincrono: use
 * sempre `await criarClienteServidor()`.
 */
/**
 * Endurece as opcoes do cookie de sessao.
 *
 * O @supabase/ssr grava o cookie SEM httpOnly por padrao, porque a biblioteca
 * foi feita para que o cliente do navegador tambem consiga ler a sessao. Nesta
 * aplicacao isso nao e mais necessario: o unico uso do cliente de navegador
 * era o upload de fotos, e ele passou a receber um token de uso unico do
 * servidor (lib/acoes/upload.ts).
 *
 * O que estava em jogo: aquele cookie carrega o access token E o refresh
 * token. Sem httpOnly, qualquer script rodando na pagina — inclusive um
 * injetado por uma falha de XSS — podia ler `document.cookie` e levar a
 * sessao inteira embora, de forma duradoura. Com httpOnly o cookie continua
 * sendo enviado nas requisicoes, mas o JavaScript da pagina nao o enxerga.
 *
 *   httpOnly — fora do alcance do JavaScript
 *   secure   — so trafega por HTTPS (desligado no localhost, que e http)
 *   sameSite lax — nao acompanha requisicoes vindas de outro site, o que
 *                  barra CSRF sem quebrar a navegacao normal por link
 */
function cookieSeguro(opcoes: CookieOptions): CookieOptions {
  return {
    ...opcoes,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
}

export const criarClienteServidor = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    exigirVariavel(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
    exigirVariavel(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, cookieSeguro(options)),
            );
          } catch {
            /*
             * Server Components nao podem escrever cookies — o HTML ja pode
             * ter comecado a ser enviado. Nao e problema: quem renova o token
             * e grava o cookie e o proxy.ts, que roda antes da pagina.
             */
          }
        },
      },
    },
  );
};
