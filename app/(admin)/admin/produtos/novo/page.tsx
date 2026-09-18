import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CabecalhoPagina } from "@/components/painel/ui-painel";
import { FormularioProduto } from "@/components/painel/formulario-produto";
import { exigirAdmin } from "@/lib/consultas/painel";

export default async function PaginaNovoProduto() {
  await exigirAdmin();

  return (
    <>
      <Button
        render={<Link href="/admin/produtos" />}
        variant="ghost"
        size="sm"
        className="-ml-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar
      </Button>

      <CabecalhoPagina
        titulo="Novo equipamento"
        descricao="Assim que salvar com a opcao de vitrine marcada, ele ja aparece no site."
      />

      <FormularioProduto />
    </>
  );
}
