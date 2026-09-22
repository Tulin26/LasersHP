import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { exigirVariavel } from "@/lib/ambiente";

/**
 * Renova a sessao do Supabase a cada requisicao e faz a checagem otimista
 * de acesso ao /admin.
 *
 * Por que isso existe: o token de acesso do Supabase expira em ~1 hora.
 * Server Components nao conseguem escrever cookies, entao quem grava o
 * token renovado no navegador e este arquivo, que roda ANTES da pagina.
 *
 * Next 16: o arquivo `middleware.ts` foi descontinuado e virou `proxy.ts`.
 * A documentacao oficial avisa que o proxy serve para checagem OTIMISTA -
 * a autorizacao de verdade continua sendo o RLS do banco + a verificacao
 * de usuario dentro de cada pagina do /admin.
 */
export async function atualizarSessao(request: NextRequest) {
  let respostaSupabase = NextResponse.next({ request });

  const supabase = createServerClient(
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
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          respostaSupabase = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            respostaSupabase.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: nao coloque nenhum codigo entre a criacao do cliente e o
  // getUser(). E esta chamada que valida o token com o Supabase e dispara
  // a gravacao do cookie renovado pelo setAll acima.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;

  // Sem sessao tentando abrir o painel -> manda para o login.
  if (!user && caminho.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirecionar", caminho);
    return NextResponse.redirect(url);
  }

  // Ja logado tentando abrir o login -> manda direto para o painel.
  if (user && caminho === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Precisa devolver ESTE objeto de resposta, senao os cookies renovados
  // acima sao perdidos e o usuario e deslogado aleatoriamente.
  return respostaSupabase;
}
