import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "LaserHP — Equipamentos de laser para estetica",
  description:
    "Venda de equipamentos de laser para estetica com atendimento direto pelo WhatsApp.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
        {/* Avisos de sucesso/erro das Server Actions caem aqui. */}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
