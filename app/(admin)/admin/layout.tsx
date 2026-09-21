import Link from "next/link";
import { LogOut, Sparkles, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navegacao } from "@/components/painel/navegacao";
import { sair } from "@/lib/acoes/autenticacao";
import { contarPedidosNovos, exigirSessao } from "@/lib/consultas/painel";
import { buscarConfiguracoes } from "@/lib/consultas/site";

export const metadata = {
  title: { default: "Painel — LaserHP", template: "%s | Painel LaserHP" },
  // O painel nunca deve aparecer em busca.
  robots: { index: false, follow: false },
};

/**
 * Layout do painel.
 *
 * O `exigirSessao()` da primeira linha e a segunda camada de protecao (o
 * proxy.ts e a primeira, o RLS e a terceira). Como todo layout envolve as
 * paginas filhas, esta checagem vale para /admin e para tudo abaixo dele.
 *
 * Atencao a um detalhe do App Router: o layout NAO re-renderiza a cada
 * navegacao entre paginas filhas. Por isso a verificacao de sessao tambem
 * aparece nas paginas que exigem admin (exigirAdmin) — nao dependa so daqui.
 */
export default async function LayoutPainel({
  children,
}: LayoutProps<"/admin">) {
  const sessao = await exigirSessao();

  const [config, pedidosNovos] = await Promise.all([
    buscarConfiguracoes(),
    contarPedidosNovos(),
  ]);

  const nome = sessao.perfil?.nome?.trim() || sessao.email;

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      {/* ------------------------------------------------------------- */}
      {/* Coluna lateral (vira barra horizontal no celular)              */}
      {/* ------------------------------------------------------------- */}
      <aside className="bg-card md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:border-r">
        <div className="flex items-center gap-2 border-b px-4 py-3 md:py-4">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {config.nome_negocio}
            </p>
            <p className="text-muted-foreground text-xs">
              {sessao.ehAdmin ? "Administrador" : "Vendedor"}
            </p>
          </div>
        </div>

        <Navegacao ehAdmin={sessao.ehAdmin} pedidosNovos={pedidosNovos} />
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* Conteudo                                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b px-4 backdrop-blur">
          <p className="text-muted-foreground truncate text-sm">
            Ola, <span className="text-foreground font-medium">{nome}</span>
          </p>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              render={<Link href="/" />}
              variant="ghost"
              size="sm"
            >
              <Store className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Ver site</span>
            </Button>

            {/*
              Sair e um <form> e nao um link: trocar a sessao e uma acao que
              muda estado no servidor, e isso nunca deve acontecer por GET —
              senao qualquer imagem ou link malicioso poderia deslogar voce.
            */}
            <form action={sair}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </form>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
