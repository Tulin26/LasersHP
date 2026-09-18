import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CabecalhoPagina } from "@/components/painel/ui-painel";
import { FormularioVenda } from "@/components/painel/formulario-venda";
import {
  exigirSessao,
  listarClientes,
  listarProdutos,
  listarVendedores,
} from "@/lib/consultas/painel";

export default async function PaginaNovaVenda(
  props: PageProps<"/admin/vendas/nova">,
) {
  const sessao = await exigirSessao();
  const searchParams = await props.searchParams;

  const texto = (chave: string) =>
    typeof searchParams[chave] === "string"
      ? (searchParams[chave] as string)
      : undefined;

  const [clientes, vendedores, produtos] = await Promise.all([
    listarClientes(),
    listarVendedores(true),
    listarProdutos(),
  ]);

  /*
   * Se quem esta logado e um vendedor com cadastro proprio, ja deixamos ele
   * selecionado. Nao e so comodidade: a policy do banco so aceita venda com
   * `vendedor_id = meu_vendedor_id()` para quem nao e admin, entao escolher
   * outro nome daria erro de permissao.
   */
  const vendedorInicial =
    texto("vendedor") ??
    (!sessao.ehAdmin ? (sessao.vendedorId ?? undefined) : undefined);

  return (
    <>
      <Button
        render={<Link href="/admin/vendas" />}
        variant="ghost"
        size="sm"
        className="-ml-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar
      </Button>

      <CabecalhoPagina
        titulo="Nova venda"
        descricao="A baixa de estoque acontece junto, na mesma transacao."
      />

      <FormularioVenda
        clientes={clientes}
        vendedores={vendedores}
        produtos={produtos.filter((p) => p.ativo)}
        clienteInicial={texto("cliente")}
        vendedorInicial={vendedorInicial}
        produtoInicial={texto("produto")}
        pedidoId={texto("pedido")}
      />
    </>
  );
}
