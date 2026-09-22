import { createServerClient, type CookieOptions } from "@supabase/ssr";
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

export async function atualizarSessao(
  request: NextRequest,
  /**
   * Cabecalhos da requisicao ja com o nonce do CSP. Precisam ser repassados
   * ao NextResponse.next, senao o Next nao enxerga o nonce e os scripts que
   * ele gera saem sem o carimbo — o navegador bloquearia todos eles.
   */
  cabecalhosDaRequisicao?: Headers,
) {
  const requisicao = cabecalhosDaRequisicao
    ? { headers: cabecalhosDaRequisicao }
    : request;

  let respostaSupabase = NextResponse.next({ request: requisicao });

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
          respostaSupabase = NextResponse.next({ request: requisicao });
          cookiesToSet.forEach(({ name, value, options }) =>
            respostaSupabase.cookies.set(name, value, cookieSeguro(options)),
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
