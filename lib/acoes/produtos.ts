"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/utils/supabase/server";
import { schemaProduto } from "@/lib/validacoes/produto";
import { gerarSlug } from "@/lib/formatar";
import { BUCKET_PRODUTOS } from "@/lib/constantes";
import {
  falha,
  sucesso,
  traduzirErroDoBanco,
  type EstadoFormulario,
} from "@/lib/acoes/tipos";

/** Revalida as telas afetadas por qualquer mudanca no catalogo. */
async function revalidarCatalogo() {
  revalidatePath("/admin/produtos");
  revalidatePath("/equipamentos");
  revalidatePath("/");
}

/**
 * Cria ou atualiza um equipamento.
 *
 * As fotos ja foram enviadas para o Storage pelo navegador antes deste ponto;
 * o que chega aqui e so a lista de caminhos, num campo escondido em JSON.
 * Por que assim: mandar o arquivo por Server Action faria o binario passar
 * pela funcao serverless da Vercel, gastando tempo e memoria do plano
 * gratuito. Indo direto do navegador para o Storage, a Vercel nem ve o
 * arquivo — e quem autoriza o upload e a policy do bucket.
 */
export async function salvarProduto(
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const id = String(formData.get("id") ?? "").trim();

  let imagens: string[] = [];
  try {
    const bruto = String(formData.get("imagens") ?? "[]");
    const analisado = JSON.parse(bruto);
    if (Array.isArray(analisado)) {
      imagens = analisado.filter((i): i is string => typeof i === "string");
    }
  } catch {
    imagens = [];
  }

  const analise = schemaProduto.safeParse({
    nome: String(formData.get("nome") ?? ""),
    modelo: String(formData.get("modelo") ?? ""),
    descricao: String(formData.get("descricao") ?? ""),
    indicacoes: String(formData.get("indicacoes") ?? ""),
    preco: String(formData.get("preco") ?? ""),
    preco_sob_consulta: formData.get("preco_sob_consulta") ?? undefined,
    estoque: String(formData.get("estoque") ?? "0"),
    estoque_minimo: String(formData.get("estoque_minimo") ?? "1"),
    imagens,
    ativo: formData.get("ativo") ?? undefined,
    destaque: formData.get("destaque") ?? undefined,
  });

  if (!analise.success) {
    return falha(
      "Confira os campos destacados.",
      analise.error.flatten().fieldErrors,
    );
  }

  const d = analise.data;
  const supabase = await criarClienteServidor();

  // O slug entra na URL da vitrine. Incluimos o modelo para diferenciar dois
  // equipamentos de mesmo nome — o banco exige slug unico.
  const baseSlug = gerarSlug([d.nome, d.modelo].filter(Boolean).join(" "));

  const registro = {
    nome: d.nome,
    modelo: d.modelo ?? null,
    descricao: d.descricao ?? null,
    indicacoes: d.indicacoes ?? null,
    preco: d.preco_sob_consulta ? null : d.preco,
    preco_sob_consulta: d.preco_sob_consulta,
    estoque: d.estoque,
    estoque_minimo: d.estoque_minimo,
    imagens: d.imagens,
    ativo: d.ativo,
    destaque: d.destaque,
  };

  if (id) {
    const { error } = await supabase
      .from("produtos")
      .update({ ...registro, slug: baseSlug })
      .eq("id", id);

    if (error) return falha(traduzirErroDoBanco(error));

    await revalidarCatalogo();
    revalidatePath(`/admin/produtos/${id}`);
    return sucesso("Equipamento atualizado.", id);
  }

  const { data, error } = await supabase
    .from("produtos")
    .insert({ ...registro, slug: baseSlug })
    .select("id")
    .single();

  if (error) return falha(traduzirErroDoBanco(error));

  await revalidarCatalogo();
  return sucesso("Equipamento cadastrado.", data.id);
}

/**
 * Exclui o equipamento e, junto, as fotos dele no Storage.
 *
 * Se o produto ja estiver em alguma venda o Postgres recusa (a chave
 * estrangeira de venda_itens e `on delete restrict`) — e isso e o certo:
 * apagar o produto apagaria o historico. Nesse caso a mensagem sugere
 * desativar em vez de excluir.
 */
export async function excluirProduto(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await criarClienteServidor();

  const { data: produto } = await supabase
    .from("produtos")
    .select("imagens")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("produtos").delete().eq("id", id);

  if (error) {
    redirect(
      `/admin/produtos?erro=${encodeURIComponent(traduzirErroDoBanco(error))}`,
    );
  }

  if (produto?.imagens?.length) {
    await supabase.storage.from(BUCKET_PRODUTOS).remove(produto.imagens);
  }

  await revalidarCatalogo();
  redirect("/admin/produtos?ok=Equipamento+excluido");
}

/** Liga/desliga o produto na vitrine sem abrir o formulario inteiro. */
export async function alternarAtivo(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const ativo = String(formData.get("ativo") ?? "") === "true";
  if (!id) return;

  const supabase = await criarClienteServidor();
  await supabase.from("produtos").update({ ativo: !ativo }).eq("id", id);

  await revalidarCatalogo();
}

/**
 * Ajuste manual de estoque (entrada de mercadoria, acerto de inventario).
 *
 * Passa pela funcao ajustar_estoque do banco em vez de um UPDATE direto: e
 * a mesma funcao usada pela venda, entao a trava contra estoque negativo e
 * o travamento da linha valem aqui tambem.
 */
export async function ajustarEstoque(
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const id = String(formData.get("id") ?? "");
  const delta = Number(formData.get("delta") ?? 0);

  if (!id || !Number.isInteger(delta) || delta === 0) {
    return falha("Informe uma quantidade inteira diferente de zero.");
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("ajustar_estoque", {
    p_produto_id: id,
    p_delta: delta,
  });

  if (error) return falha(traduzirErroDoBanco(error));

  await revalidarCatalogo();
  revalidatePath(`/admin/produtos/${id}`);
  return sucesso(
    delta > 0
      ? `Entrada de ${delta} registrada.`
      : `Baixa de ${-delta} registrada.`,
  );
}
