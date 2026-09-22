import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/tipos/database.types";
import { exigirVariavel } from "@/lib/ambiente";

/**
 * Cliente com a chave SECRETA. Ela ignora o RLS por completo.
 *
 * A primeira linha (`import "server-only"`) e a trava: se algum dia um
 * componente com "use client" importar este arquivo, o build QUEBRA em vez
 * de mandar a chave para o navegador. E uma protecao em tempo de compilacao,
 * bem melhor que confiar na memoria.
 *
 * Usamos isto em exatamente um lugar: gravar o pedido da vitrine, onde
 * precisamos conferir o limite por IP antes de inserir.
 */
export const criarClienteAdmin = () =>
  createClient<Database>(
    exigirVariavel(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
    exigirVariavel(
      process.env.SUPABASE_SECRET_KEY,
      "SUPABASE_SECRET_KEY",
    ),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
