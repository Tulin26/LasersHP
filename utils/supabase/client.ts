import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/tipos/database.types";
import { exigirVariavel } from "@/lib/ambiente";

/**
 * Cliente do Supabase para o NAVEGADOR (Client Components).
 *
 * So use isto quando precisar de algo interativo que nao da para resolver no
 * servidor — no nosso caso, o upload de foto direto para o Storage. Leitura
 * de dados fica nos Server Components, que nao mandam nada disso para o
 * navegador.
 *
 * A chave aqui e a publicavel: ela pode ser lida por qualquer um. Quem
 * protege os dados e o RLS, nao o segredo da chave.
 */
export const criarClienteNavegador = () =>
  createBrowserClient<Database>(
    exigirVariavel(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
    exigirVariavel(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ),
  );
