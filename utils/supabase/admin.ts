import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente ADMINISTRATIVO: usa a chave secreta (sb_secret_...), que IGNORA o RLS.
 *
 * O import "server-only" faz o build quebrar se algum Client Component
 * importar este arquivo por engano - e a trava que impede o segredo de
 * vazar para o navegador.
 *
 * Use somente onde precisamos passar por cima do RLS de forma controlada:
 * gravar pedidos vindos da vitrine publica, importar planilha, etc.
 */
export const criarClienteAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
