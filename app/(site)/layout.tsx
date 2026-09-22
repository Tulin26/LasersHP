import type { Metadata } from "next";
import { Cabecalho } from "@/components/site/cabecalho";
import { Rodape } from "@/components/site/rodape";
import { BotaoWhatsApp } from "@/components/site/botao-whatsapp";
import { buscarConfiguracoes } from "@/lib/consultas/site";

/**
 * Layout da vitrine publica.
 *
 * O nome `(site)` entre parenteses cria um GRUPO DE ROTA: serve para dar um
 * layout proprio a um conjunto de paginas sem que a palavra "site" apareca
 * na URL. Por isso `app/(site)/page.tsx` responde em "/" e nao em "/site".
 * O painel usa o mesmo truque com `(admin)`.
 *
 * generateMetadata e a versao assincrona do `export const metadata`: usamos
 * ela porque os textos de SEO vem do banco, editaveis pelo painel.
 */
export async function generateMetadata(): Promise<Metadata> {
  const config = await buscarConfiguracoes();

  const titulo =
    config.seo_titulo || `${config.nome_negocio} — ${config.titulo_home}`;
  const descricao =
    config.seo_descricao ||
    config.subtitulo_home ||
    "Equipamentos de laser para estetica.";

  return {
    title: { default: titulo, template: `%s | ${config.nome_negocio}` },
    description: descricao,
    // openGraph alimenta a previa do link no WhatsApp, Instagram e Facebook.
    openGraph: {
      title: titulo,
      description: descricao,
      type: "website",
      locale: "pt_BR",
      siteName: config.nome_negocio,
      images: config.og_imagem_url
        ? [{ url: config.og_imagem_url }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descricao,
      images: config.og_imagem_url ? [config.og_imagem_url] : undefined,
    },
  };
}

export default async function LayoutSite({ children }: LayoutProps<"/">) {
  const config = await buscarConfiguracoes();

  // `dark noite` liga o tema escuro SO na vitrine; o painel continua claro.
  //   - `dark` e a classe que o shadcn ja usava: faz os componentes de
  //     interface trocarem para as variantes escuras;
  //   - `noite` vem depois no globals.css e sobrescreve as cores dele pela
  //     paleta do projeto (preto frio, titanio, osso).
  // O `flex flex-1 flex-col` repete o que o <body> fazia, para o rodape
  // continuar colado embaixo em pagina curta.
  return (
    <div className="dark noite bg-background text-foreground flex flex-1 flex-col">
      <Cabecalho nomeNegocio={config.nome_negocio} whatsapp={config.whatsapp} />

      <main className="flex-1">{children}</main>

      <Rodape config={config} />

      <BotaoWhatsApp
        numero={config.whatsapp}
        nomeNegocio={config.nome_negocio}
      />
    </div>
  );
}
