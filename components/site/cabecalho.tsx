import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { montarLinkWhatsApp, mensagemGenerica } from "@/lib/whatsapp";

/**
 * Cabecalho da vitrine.
 *
 * A lista de links fica numa constante so e e usada duas vezes: na linha do
 * logo (computador) e numa segunda linha rolavel (celular). Assim nao existe
 * a chance de alguem adicionar uma pagina num lugar e esquecer do outro.
 *
 * Nenhum destes links abre aba nova. Navegacao dentro do proprio site deve
 * acontecer na mesma aba — o <Link> do Next ainda troca so o conteudo que
 * mudou, sem recarregar a pagina inteira.
 */

const LINKS = [
  { href: "/", texto: "Inicio" },
  { href: "/equipamentos", texto: "Equipamentos" },
  { href: "/#sobre", texto: "Sobre" },
  { href: "/login", texto: "Area restrita" },
];

export function Cabecalho({
  nomeNegocio,
  whatsapp,
}: {
  nomeNegocio: string;
  whatsapp: string;
}) {
  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <span className="text-base sm:text-lg">{nomeNegocio}</span>
        </Link>

        <nav
          aria-label="Navegacao principal"
          className="hidden items-center gap-6 text-sm sm:flex"
        >
          {LINKS.map(({ href, texto }) => (
            <Link
              key={href}
              href={href}
              className="text-muted-foreground hover:text-foreground transition"
            >
              {texto}
            </Link>
          ))}
        </nav>

        {whatsapp ? (
          <Button
            render={
              <a
                href={montarLinkWhatsApp(
                  whatsapp,
                  mensagemGenerica(nomeNegocio),
                )}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            size="sm"
          >
            Falar agora
          </Button>
        ) : (
          <Button render={<Link href="/equipamentos" />} size="sm">
            Ver catalogo
          </Button>
        )}
      </div>

      {/*
        No celular a navegacao desce para uma segunda linha, que rola de lado
        se nao couber. Antes ela simplesmente sumia abaixo de `sm`, e como a
        maior parte do acesso vem do link do Instagram — ou seja, do celular —
        era justamente quem mais precisava que ficava sem menu.
      */}
      <nav
        aria-label="Navegacao principal"
        className="flex gap-1 overflow-x-auto border-t px-3 py-2 text-sm sm:hidden"
      >
        {LINKS.map(({ href, texto }) => (
          <Link
            key={href}
            href={href}
            className="text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded-lg px-3 py-1.5 transition"
          >
            {texto}
          </Link>
        ))}
      </nav>
    </header>
  );
}
