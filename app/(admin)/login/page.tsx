import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { FormularioLogin } from "@/components/painel/formulario-login";
import { buscarConfiguracoes } from "@/lib/consultas/site";

export const metadata = {
  title: "Entrar no painel",
  // Tela de login nao deve aparecer no Google.
  robots: { index: false, follow: false },
};

export default async function PaginaLogin(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const config = await buscarConfiguracoes();

  const bruto =
    typeof searchParams.redirecionar === "string"
      ? searchParams.redirecionar
      : "/admin";

  // Mesma checagem de open redirect que existe na Server Action: aceita
  // somente caminho interno.
  const redirecionar =
    bruto.startsWith("/") && !bruto.startsWith("//") ? bruto : "/admin";

  return (
    <div className="fundo-vitrine flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm transition"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao site
        </Link>

        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h1 className="leading-tight font-semibold">
                {config.nome_negocio}
              </h1>
              <p className="text-muted-foreground text-xs">
                Painel administrativo
              </p>
            </div>
          </div>

          <div className="mt-6">
            <FormularioLogin redirecionar={redirecionar} />
          </div>
        </div>

        <p className="text-muted-foreground mt-4 text-center text-xs">
          Acesso restrito a equipe. Se esqueceu a senha, peca ao administrador
          para redefinir pelo painel do Supabase.
        </p>
      </div>
    </div>
  );
}
