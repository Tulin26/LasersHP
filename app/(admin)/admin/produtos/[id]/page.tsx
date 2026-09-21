import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CabecalhoPagina } from "@/components/painel/ui-painel";
import { FormularioProduto } from "@/components/painel/formulario-produto";
import { AjusteEstoque } from "@/components/painel/ajuste-estoque";
import { BotaoExcluir } from "@/components/painel/botao-excluir";
import { buscarProduto, exigirAdmin } from "@/lib/consultas/painel";
import { excluirProduto } from "@/lib/acoes/produtos";
import { formatarDataHora } from "@/lib/formatar";

export default async function PaginaEditarProduto({
  params,
}: PageProps<"/admin/produtos/[id]">) {
  await exigirAdmin();

  const { id } = await params;
  const produto = await buscarProduto(id);

  if (!produto) notFound();

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
        titulo={produto.nome}
        descricao={`Atualizado em ${formatarDataHora(produto.atualizado_em)}.`}
      >
        {produto.ativo && (
          <Button
            render={
              <Link href={`/equipamentos/${produto.slug}`} />
            }
            variant="outline"
            size="sm"
          >
            <Store className="size-4" aria-hidden="true" />
            Ver na vitrine
          </Button>
        )}

        <BotaoExcluir
          acao={excluirProduto}
          id={produto.id}
          pergunta={`Excluir "${produto.nome}"? As fotos tambem serao apagadas. Se o equipamento ja aparece em alguma venda, o banco vai recusar — nesse caso desmarque "visivel na vitrine".`}
        />
      </CabecalhoPagina>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0">
          <FormularioProduto produto={produto} />
        </div>

        <aside className="bg-card h-fit rounded-xl border p-4 lg:sticky lg:top-20">
          <h2 className="mb-3 font-semibold">Movimentar estoque</h2>
          <AjusteEstoque
            produtoId={produto.id}
            estoqueAtual={produto.estoque}
          />
        </aside>
      </div>
    </>
  );
}
