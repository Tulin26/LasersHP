import { createServerClient } from "@supabase/ssr";
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
              cookieStore.set(name, value, options),
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
