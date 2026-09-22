import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

/*
 * Tipografia.
 *
 * Duas familias com papeis diferentes, que e o que separa um site desenhado
 * de um site montado:
 *
 *   Space Grotesk — titulos. Geometrica e um pouco tecnica, com desenho
 *     proprio no "g" e no "a". Passa precisao de equipamento sem ficar fria.
 *   Inter — texto corrido, rotulo de formulario, tabela do painel. Feita para
 *     ser lida sem chamar atencao, que e exatamente o que uma ficha tecnica
 *     precisa.
 *
 * O `display: "swap"` mostra o texto na fonte do sistema enquanto a definitiva
 * baixa, em vez de deixar a tela em branco — importante para quem abre pelo
 * Instagram no 4G.
 */
const fonteTitulo = Space_Grotesk({
  variable: "--fonte-titulo",
  subsets: ["latin"],
  display: "swap",
});

const fonteTexto = Inter({
  variable: "--fonte-texto",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Layout raiz: e o unico lugar do projeto com <html> e <body>.
 *
 * Os layouts de `(site)` e `(admin)` ficam por dentro deste e cuidam do
 * cabecalho/rodape de cada area. Como este arquivo e um Server Component,
 * nada aqui vira JavaScript no navegador.
 *
 * metadataBase existe para o Next conseguir transformar "/imagem.png" na URL
 * absoluta que o WhatsApp e o Instagram exigem ao gerar a previa do link.
 */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  /*
   * So o `default`, sem `template`. O template de um layout pai tambem
   * embrulha o `default` do filho — com um aqui, a home da vitrine saia como
   * "LaserHP — Equipamentos... | LaserHP". Cada area define o proprio
   * template: a vitrine em app/(site)/layout.tsx e o painel em
   * app/(admin)/admin/layout.tsx.
   */
  title: "LaserHP — Equipamentos de laser para estética e saúde",
  description:
    "Equipamentos de laser para clínicas de estética e profissionais de saúde. Atendimento direto pelo WhatsApp.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${fonteTitulo.variable} ${fonteTexto.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
        {/* Avisos de sucesso/erro das Server Actions caem aqui. */}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
