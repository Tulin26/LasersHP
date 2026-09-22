import { type NextRequest } from "next/server";
import { atualizarSessao } from "@/utils/supabase/proxy";

/**
 * Proxy do Next 16 (o antigo middleware.ts).
 *
 * Roda no servidor antes de cada pagina e faz duas coisas:
 *   1. renova a sessao do Supabase (o token expira em ~1 hora);
 *   2. monta o Content-Security-Policy da resposta.
 */

/** Host do Supabase, para liberar o Storage no CSP sem chumbar o endereco. */
const HOST_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : "";

/**
 * Content-Security-Policy.
 *
 * O que ele faz, em uma frase: diz ao navegador de onde ele PODE carregar
 * cada tipo de coisa, e manda recusar todo o resto. Se um dia entrar um
 * `<script>` indesejado na pagina — por um campo mal filtrado, por uma
 * biblioteca comprometida — o navegador se recusa a executa-lo.
 *
 * ---------------------------------------------------------------------------
 * O nonce
 * ---------------------------------------------------------------------------
 * O Next precisa de alguns scripts embutidos na propria pagina para "acordar"
 * o React no navegador. Um CSP rigoroso bloquearia esses scripts junto com os
 * indesejados, porque nao ha como olhar um <script> embutido e saber quem o
 * escreveu.
 *
 * O nonce resolve: um numero aleatorio, diferente a cada carregamento de
 * pagina. O cabecalho diz "so execute scripts embutidos que tragam ESTE
 * numero", e o Next carimba o numero nos scripts dele. Um atacante que
 * conseguisse injetar um <script> nao teria como adivinhar o numero daquela
 * requisicao especifica.
 *
 * Por isso ele e gerado aqui, por requisicao, e nao no next.config.ts, que e
 * lido uma vez so quando a aplicacao sobe.
 */
function montarCSP(nonce: string): string {
  const desenvolvimento = process.env.NODE_ENV === "development";

  const regras = [
    // Padrao para tudo que nao tiver regra propria abaixo.
    `default-src 'self'`,

    /*
     * 'strict-dynamic' deixa um script ja aprovado (pelo nonce) carregar os
     * pedacos de que precisa, sem ter que listar cada arquivo.
     *
     * 'unsafe-eval' entra SO em desenvolvimento: o React usa eval() para
     * remontar a pilha de erro do servidor dentro do navegador. Em producao
     * nem o React nem o Next usam eval, entao la ele fica de fora.
     */
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${desenvolvimento ? " 'unsafe-eval'" : ""}`,

    /*
     * Aqui o projeto se afasta de proposito do exemplo da documentacao, que
     * sugere nonce tambem para estilo.
     *
     * Motivo: o next/image escreve estilo direto no atributo `style` das
     * imagens, e atributo de estilo nao tem onde carimbar nonce. Com a regra
     * rigorosa, as fotos do catalogo apareceriam deformadas.
     *
     * A troca e aceitavel: estilo injetado consegue no maximo deixar a pagina
     * feia ou esconder um elemento; script injetado rouba dados e sessao. A
     * defesa que importa, a de script, continua rigorosa.
     */
    `style-src 'self' 'unsafe-inline'`,

    // blob: e data: sao usados na previa da foto antes de ela subir.
    `img-src 'self' blob: data: ${HOST_SUPABASE}`.trim(),

    `font-src 'self'`,

    // Para onde o JavaScript da pagina pode abrir conexao. O Storage precisa
    // estar aqui por causa do envio de fotos com URL assinada.
    `connect-src 'self' ${HOST_SUPABASE}`.trim(),

    // <object> e <embed> sao porta de entrada antiga e nao usamos nenhum.
    `object-src 'none'`,

    // Impede que alguem troque a base dos links relativos da pagina.
    `base-uri 'self'`,

    // Formularios so podem enviar para o proprio site.
    `form-action 'self'`,

    // Ninguem pode embutir este site num iframe (clickjacking).
    `frame-ancestors 'none'`,

    // Qualquer http:// que sobrar e promovido para https:// pelo navegador.
    `upgrade-insecure-requests`,
  ];

  return regras.join("; ");
}

export async function proxy(request: NextRequest) {
  // Aleatorio por requisicao: e isso que torna o nonce impossivel de adivinhar.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = montarCSP(nonce);

  /*
   * O nonce precisa chegar de dois jeitos:
   *
   *   - no cabecalho da RESPOSTA, para o navegador saber a regra;
   *   - no cabecalho da REQUISICAO, porque e de la que o Next le o valor
   *     para carimbar nos scripts que ele mesmo gera.
   *
   * Faltando o segundo, o navegador bloquearia os scripts do proprio Next e
   * a pagina ficaria sem interatividade nenhuma.
   */
  const cabecalhosDaRequisicao = new Headers(request.headers);
  cabecalhosDaRequisicao.set("x-nonce", nonce);
  cabecalhosDaRequisicao.set("Content-Security-Policy", csp);

  const resposta = await atualizarSessao(request, cabecalhosDaRequisicao);
  resposta.headers.set("Content-Security-Policy", csp);

  return resposta;
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
