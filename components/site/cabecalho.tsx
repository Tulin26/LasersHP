import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { montarLinkWhatsApp, mensagemGenerica } from "@/lib/whatsapp";

/**
 * Cabecalho da vitrine.
 *
 * Mobile-first: no celular sobram o logo e o botao de WhatsApp; os links de
 * navegacao so aparecem a partir de `sm:`. Como o site inteiro tem tres
 * paginas, um menu sanduiche seria mais atrito do que ajuda.
 */
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

        <nav className="hidden items-center gap-6 text-sm sm:flex">
          <Link
            href="/equipamentos"
            className="text-muted-foreground hover:text-foreground transition"
          >
            Equipamentos
          </Link>
          <Link
            href="/#sobre"
            className="text-muted-foreground hover:text-foreground transition"
          >
            Sobre
          </Link>
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
    </header>
  );
}
