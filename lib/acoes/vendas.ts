"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/utils/supabase/server";
import { schemaVenda } from "@/lib/validacoes/venda";
import {
  falha,
  sucesso,
  traduzirErroDoBanco,
  type EstadoFormulario,
} from "@/lib/acoes/tipos";

function revalidarVendas(id?: string) {
  revalidatePath("/admin/vendas");
  revalidatePath("/admin");
  revalidatePath("/admin/produtos");
  if (id) revalidatePath(`/admin/vendas/${id}`);
}

/**
 * Registra uma venda.
 *
 * Tudo acontece dentro da funcao `registrar_venda` do Postgres, numa unica
 * transacao. Isso importa muito: se a baixa de estoque do segundo item
 * falhar, o cabecalho e o primeiro item somem junto — nao fica venda pela
 * metade no banco.
 *
 * Se isso fosse feito aqui em TypeScript com quatro chamadas seguidas
 * (insere venda, insere item, baixa estoque, aplica desconto), qualquer erro
 * no meio deixaria lixo gravado. A funcao SQL e o equivalente ao
 * @Transactional que voce usaria no Java.
 */
export async function registrarVenda(
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  let itens: unknown = [];
  try {
    itens = JSON.parse(String(formData.get("itens") ?? "[]"));
  } catch {
    return falha("Nao foi possivel ler os itens da venda.");
  }

  const analise = schemaVenda.safeParse({
    data: String(formData.get("data") ?? ""),
    cliente_id: String(formData.get("cliente_id") ?? ""),
    vendedor_id: String(formData.get("vendedor_id") ?? ""),
    pedido_id: String(formData.get("pedido_id") ?? "") || undefined,
    itens,
    desconto: String(formData.get("desconto") ?? "0"),
    forma_pagamento: String(formData.get("forma_pagamento") ?? "pix"),
    status: String(formData.get("status") ?? "pendente"),
    observacoes: String(formData.get("observacoes") ?? ""),
    baixar_estoque: formData.get("baixar_estoque") !== "false",
  });

  if (!analise.success) {
    const campos = analise.error.flatten().fieldErrors;
    return falha(
      campos.itens?.[0] ?? "Confira os campos destacados.",
      campos as Record<string, string[] | undefined>,
    );
  }

  const d = analise.data;
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase.rpc("registrar_venda", {
    p_cliente_id: d.cliente_id,
    p_vendedor_id: d.vendedor_id,
    p_itens: d.itens,
    p_desconto: d.desconto,
    p_forma_pagamento: d.forma_pagamento,
    p_status: d.status,
    p_data: d.data,
    p_pedido_id: d.pedido_id ?? null,
    p_observacoes: d.observacoes ?? null,
    p_baixar_estoque: d.baixar_estoque,
  });

  if (error) return falha(traduzirErroDoBanco(error));

  // Veio de um lead do site: marca o pedido como fechado.
  if (d.pedido_id) {
    await supabase
      .from("pedidos")
      .update({ status: "fechado" })
      .eq("id", d.pedido_id);
    revalidatePath("/admin/pedidos");
  }

  revalidarVendas(data?.id);
  return sucesso("Venda registrada.", data?.id);
}

/**
 * Cancela a venda e devolve os equipamentos ao estoque.
 *
 * Preferimos cancelar a excluir: o historico continua visivel e o relatorio
 * do mes mostra que aquela venda existiu e caiu. A funcao do banco tambem
 * protege contra cancelar duas vezes e devolver estoque em dobro.
 */
export async function cancelarVenda(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("cancelar_venda", { p_venda_id: id });

  if (error) {
    redirect(
      `/admin/vendas?erro=${encodeURIComponent(traduzirErroDoBanco(error))}`,
    );
  }

  revalidarVendas(id);
  redirect("/admin/vendas?ok=Venda+cancelada+e+estoque+devolvido");
}

/** Troca so o status (ex.: pendente -> pago), sem mexer em estoque. */
export async function atualizarStatusVenda(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !["pago", "pendente"].includes(status)) return;

  const supabase = await criarClienteServidor();
  await supabase
    .from("vendas")
    .update({ status: status as "pago" | "pendente" })
    .eq("id", id);

  revalidarVendas(id);
}

/** Exclusao definitiva — so o admin consegue (policy "admin apaga vendas"). */
export async function excluirVenda(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await criarClienteServidor();

  // Devolve o estoque antes de apagar; senao os equipamentos sumiriam da
  // contagem sem nunca terem sido vendidos de fato.
  await supabase.rpc("cancelar_venda", { p_venda_id: id });

  const { error } = await supabase.from("vendas").delete().eq("id", id);

  if (error) {
    redirect(
      `/admin/vendas?erro=${encodeURIComponent(traduzirErroDoBanco(error))}`,
    );
  }

  revalidarVendas();
  redirect("/admin/vendas?ok=Venda+excluida");
}
