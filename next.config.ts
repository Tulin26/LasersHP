import type { NextConfig } from "next";

/**
 * O next/image so aceita carregar imagens de dominios declarados aqui.
 * E uma protecao: sem isso qualquer um poderia usar o seu servidor da Vercel
 * para redimensionar as imagens do site dele, gastando a sua cota.
 *
 * O host sai da propria variavel de ambiente para nao ficar um endereco
 * chumbado no codigo — se voce trocar de projeto Supabase, nada aqui muda.
 */
const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
const hostSupabase = urlSupabase ? new URL(urlSupabase).hostname : null;

/**
 * Cabecalhos de seguranca.
 *
 * O que ja vinha de graca da Vercel: o redirecionamento de http para https
 * (308) e o Strict-Transport-Security, que manda o navegador nem tentar http
 * nas proximas visitas. Esses nao precisam ser declarados aqui.
 *
 * O que faltava e entra agora. Cada um fecha uma porta diferente:
 */
const CABECALHOS_SEGURANCA = [
  {
    /*
     * Impede o navegador de "adivinhar" o tipo de um arquivo pelo conteudo.
     * Sem isto, um arquivo enviado como imagem mas contendo HTML poderia ser
     * interpretado como pagina e executar script.
     */
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    /*
     * Ninguem pode abrir este site dentro de um <iframe>. Barra clickjacking:
     * o golpe de sobrepor um site invisivel ao que a vitima pensa estar
     * clicando. O CSP abaixo diz o mesmo em frame-ancestors; os dois ficam
     * porque navegadores antigos so entendem este.
     */
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    /*
     * Ao sair do site por um link, manda so o dominio de origem, nunca o
     * endereco completo. Assim a pagina de destino nao fica sabendo, por
     * exemplo, o id que estava na URL do painel.
     */
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    /*
     * Desliga recursos que este site nunca usa. Se um dia um script
     * indesejado entrar na pagina, ele ja chega sem camera, microfone e
     * localizacao.
     */
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  /*
   * Por padrao o Next anuncia "X-Powered-By: Next.js" em toda resposta.
   * Nao ha ganho nenhum nisso, e entrega de graca qual pilha o site usa —
   * informacao que serve para procurar falhas conhecidas da versao.
   */
  poweredByHeader: false,

  images: {
    remotePatterns: hostSupabase
      ? [
          {
            protocol: "https",
            hostname: hostSupabase,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },

  async headers() {
    return [{ source: "/:path*", headers: CABECALHOS_SEGURANCA }];
  },
};

export default nextConfig;
