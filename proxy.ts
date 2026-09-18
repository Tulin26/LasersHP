import { type NextRequest } from "next/server";
import { atualizarSessao } from "@/utils/supabase/proxy";

/**
 * Proxy do Next 16 (o antigo middleware.ts).
 * Roda no servidor antes de cada pagina; aqui so renovamos a sessao.
 */
export async function proxy(request: NextRequest) {
  return await atualizarSessao(request);
}

export const config = {
  /**
   * Evita rodar em arquivos estaticos e imagens - senao o proxy encarece
   * (e pode bloquear) o carregamento de CSS, JS e fotos dos produtos.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
