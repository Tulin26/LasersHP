import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono, Instrument_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Fontes da vitrine.
 *
 * O painel continua na Geist, que e a fonte padrao do Next e serve bem a uma
 * tela de cadastro. A vitrine ganha um par proprio:
 *
 * - Archivo com o eixo de LARGURA (`wdth`). E uma fonte variavel: em vez de
 *   um arquivo por peso, vem um so que o navegador deforma. Usamos ela bem
 *   larga e em caixa alta no nome do aparelho, imitando a letra gravada no
 *   corpo de um instrumento. A DMC usa condensada pesada nos anuncios dela;
 *   larga e o contrario disso, de proposito.
 * - Instrument Sans no texto corrido, por ser compacta e legivel em corpo
 *   pequeno — a ficha tecnica tem muita linha curta.
 *
 * A Geist Mono ganha um segundo emprego: os numeros da ficha. Monoespacada
 * alinha algarismo embaixo de algarismo, como o visor do proprio aparelho.
 */
const archivo = Archivo({
  variable: "--fonte-titulo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const instrumentSans = Instrument_Sans({
  variable: "--fonte-corpo",
  subsets: ["latin"],
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
  title: "LaserHP — Lasers de fotobiomodulacao DMC",
  description:
    "Aparelhos de laserterapia DMC para odontologia, fisioterapia, enfermagem e estetica, com atendimento direto pelo WhatsApp.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${instrumentSans.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
        {/* Avisos de sucesso/erro das Server Actions caem aqui. */}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
