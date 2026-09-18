import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CabecalhoPagina } from "@/components/painel/ui-painel";
import { FormularioConfiguracoes } from "@/components/painel/formulario-configuracoes";
import { exigirAdmin } from "@/lib/consultas/painel";
import { buscarConfiguracoes } from "@/lib/consultas/site";

export default async function PaginaConfiguracoes() {
  await exigirAdmin();

  const config = await buscarConfiguracoes();

  return (
    <>
      <CabecalhoPagina
        titulo="Configuracoes"
        descricao="Contato, textos do site e dados de compartilhamento."
      >
        <Button
          render={<Link href="/" target="_blank" />}
          variant="outline"
          size="sm"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          Ver site
        </Button>
      </CabecalhoPagina>

      <FormularioConfiguracoes config={config} />
    </>
  );
}
