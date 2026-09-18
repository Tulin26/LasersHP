import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para uso no SERVIDOR (Server Components, Server Actions
 * e Route Handlers). Le e escreve os cookies de sessao do usuario logado.
 *
 * Continua usando a chave publicavel de proposito: assim o RLS do banco
 * continua valendo e cada usuario so enxerga o que a policy permite.
 *
 * Observacao de Next 16: `cookies()` e assincrono, por isso a funcao e `async`.
 */
export const criarClienteServidor = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
            // Server Components nao podem escrever cookies. Pode ignorar:
            // quem renova a sessao e o proxy.ts a cada requisicao.
          }
        },
      },
    },
  );
};
