import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Pagina 404 da vitrine.
 *
 * O Next usa este arquivo automaticamente quando uma rota nao existe ou
 * quando algum componente chama notFound().
 */
export default function NaoEncontrado() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="text-primary text-6xl font-semibold">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Pagina nao encontrada
      </h1>
      <p className="text-muted-foreground mt-2">
        O endereco que voce abriu nao existe ou o equipamento saiu do catalogo.
      </p>
      <div className="mt-8 flex gap-3">
        <Button render={<Link href="/equipamentos" />}>Ver equipamentos</Button>
        <Button render={<Link href="/" />} variant="outline">
          Voltar ao inicio
        </Button>
      </div>
    </div>
  );
}
