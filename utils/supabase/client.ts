import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso no NAVEGADOR (Client Components).
 * Usa apenas a chave publicavel, entao tudo o que ele faz passa pelo RLS.
 */
export const criarClienteNavegador = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
