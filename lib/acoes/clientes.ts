"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/utils/supabase/server";
import { schemaCliente, schemaVendedor } from "@/lib/validacoes/cliente";
import { apenasDigitos } from "@/lib/formatar";
import {
  falha,
  sucesso,
  traduzirErroDoBanco,
  type EstadoFormulario,
} from "@/lib/acoes/tipos";

// ---------------------------------------------------------------------------
// CLIENTES
// ---------------------------------------------------------------------------

export async function salvarCliente(
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const id = String(formData.get("id") ?? "").trim();

  const analise = schemaCliente.safeParse({
    nome: String(formData.get("nome") ?? ""),
    telefone: String(formData.get("telefone") ?? ""),
    email: String(formData.get("email") ?? ""),
    documento: String(formData.get("documento") ?? ""),
    cidade: String(formData.get("cidade") ?? ""),
    observacoes: String(formData.get("observacoes") ?? ""),
  });

  if (!analise.success) {
    return falha(
      "Confira os campos destacados.",
      analise.error.flatten().fieldErrors,
    );
  }

  const d = analise.data;
  const supabase = await criarClienteServidor();

  const registro = {
    nome: d.nome,
    // Guardamos so digitos: assim a busca por telefone funciona mesmo quando
    // uma pessoa digitou com parenteses e a outra nao.
    telefone: d.telefone ? apenasDigitos(d.telefone) : null,
    email: d.email ?? null,
    documento: d.documento ?? null,
    cidade: d.cidade ?? null,
    observacoes: d.observacoes ?? null,
  };

  if (id) {
    const { error } = await supabase
      .from("clientes")
      .update(registro)
      .eq("id", id);

    if (error) return falha(traduzirErroDoBanco(error));

    revalidatePath("/admin/clientes");
    revalidatePath(`/admin/clientes/${id}`);
    return sucesso("Cliente atualizado.", id);
  }

  const { data, error } = await supabase
    .from("clientes")
    .insert(registro)
    .select("id")
    .single();

  if (error) return falha(traduzirErroDoBanco(error));

  revalidatePath("/admin/clientes");
  return sucesso("Cliente cadastrado.", data.id);
}

export async function excluirCliente(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("clientes").delete().eq("id", id);

  if (error) {
    redirect(
      `/admin/clientes?erro=${encodeURIComponent(traduzirErroDoBanco(error))}`,
    );
  }

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes?ok=Cliente+excluido");
}

// ---------------------------------------------------------------------------
// VENDEDORES
// ---------------------------------------------------------------------------

/**
 * Cadastro simples de vendedor.
 *
 * Nao criamos login aqui: o usuario do Supabase Auth e criado pelo painel do
 * Supabase (Authentication > Users) e depois ligado a este cadastro pelo SQL
 * em `0002_criar_admin.sql`. Criar usuario pela aplicacao exigiria expor uma
 * rota que usa a chave secreta para mexer em contas — risco desnecessario
 * para um time de duas ou tres pessoas.
 */
export async function salvarVendedor(
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const id = String(formData.get("id") ?? "").trim();

  const analise = schemaVendedor.safeParse({
    nome: String(formData.get("nome") ?? ""),
    telefone: String(formData.get("telefone") ?? ""),
    email: String(formData.get("email") ?? ""),
    observacoes: String(formData.get("observacoes") ?? ""),
    ativo: formData.get("ativo") ?? undefined,
  });

  if (!analise.success) {
    return falha(
      "Confira os campos destacados.",
      analise.error.flatten().fieldErrors,
    );
  }

  const d = analise.data;
  const supabase = await criarClienteServidor();

  const registro = {
    nome: d.nome,
    telefone: d.telefone ? apenasDigitos(d.telefone) : null,
    email: d.email ?? null,
    observacoes: d.observacoes ?? null,
    ativo: d.ativo,
  };

  if (id) {
    const { error } = await supabase
      .from("vendedores")
      .update(registro)
      .eq("id", id);

    if (error) return falha(traduzirErroDoBanco(error));

    revalidatePath("/admin/vendedores");
    return sucesso("Vendedor atualizado.", id);
  }

  const { data, error } = await supabase
    .from("vendedores")
    .insert(registro)
    .select("id")
    .single();

  if (error) return falha(traduzirErroDoBanco(error));

  revalidatePath("/admin/vendedores");
  return sucesso("Vendedor cadastrado.", data.id);
}

export async function excluirVendedor(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("vendedores").delete().eq("id", id);

  if (error) {
    // Vendedor com venda no historico nao pode sumir (on delete restrict).
    // A saida certa e desmarcar "ativo" — ele some das listas novas e o
    // historico continua de pe.
    redirect(
      `/admin/vendedores?erro=${encodeURIComponent(
        `${traduzirErroDoBanco(error)} Desmarque "ativo" em vez de excluir.`,
      )}`,
    );
  }

  revalidatePath("/admin/vendedores");
  redirect("/admin/vendedores?ok=Vendedor+excluido");
}
