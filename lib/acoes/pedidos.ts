"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/utils/supabase/server";
import { criarClienteAdmin } from "@/utils/supabase/admin";
import { schemaPedido, schemaStatusPedido } from "@/lib/validacoes/pedido";
import { apenasDigitos } from "@/lib/formatar";
import { exigirVariavel } from "@/lib/ambiente";
import {
  falha,
  sucesso,
  traduzirErroDoBanco,
  type EstadoFormulario,
} from "@/lib/acoes/tipos";

/**
 * Identifica o visitante sem guardar o IP em texto puro.
 *
 * Guardar IP e dado pessoal (LGPD). O hash resolve: serve para contar quantos
 * envios vieram da mesma origem, mas nao da para voltar dele ao IP original.
 * O "tempero" usa a chave secreta para que nem quem tivesse o banco na mao
 * conseguisse testar IPs um por um.
 */
async function calcularHashDoIP(): Promise<string> {
  const cabecalhos = await headers();

  // Na Vercel o IP real vem no x-forwarded-for; o primeiro da lista e o
  // visitante, os seguintes sao os proxies pelo caminho.
  const ip =
    cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    cabecalhos.get("x-real-ip") ||
    "desconhecido";

  /*
   * O "tempero" (salt) impede que alguem com acesso de leitura a tabela
   * descubra o IP de um visitante testando hashes de IPs conhecidos — sem
   * ele, sha256("189.1.2.3") e sempre o mesmo valor e da para montar uma
   * tabela de consulta com os poucos bilhoes de IPv4 que existem.
   *
   * Duas coisas mudaram aqui:
   *
   * 1. Antes havia um `?? "laserhp"` no fim. Esse texto esta num repositorio
   *    PUBLICO, entao se a variavel faltasse o tempero virava algo que
   *    qualquer um pode ler — ou seja, nenhum tempero.
   *
   * 2. Antes o tempero era a propria SUPABASE_SECRET_KEY. Funcionava, mas
   *    prendia uma coisa na outra: no dia em que voce trocasse a chave
   *    secreta (o que se deve fazer de tempos em tempos), TODO hash gravado
   *    deixaria de bater com o novo e o limite de 5 pedidos por hora
   *    zeraria para todo mundo de uma vez. Com uma variavel propria, girar a
   *    chave do Supabase nao mexe no controle de spam.
   *
   * O `??` na SUPABASE_SECRET_KEY continua como rede de seguranca para nao
   * derrubar o formulario da vitrine se a SALT_HASH_IP ainda nao tiver sido
   * cadastrada na Vercel.
   */
  const tempero = exigirVariavel(
    process.env.SALT_HASH_IP ?? process.env.SUPABASE_SECRET_KEY,
    "SALT_HASH_IP",
  );

  return createHash("sha256").update(`${tempero}:${ip}`).digest("hex");
}

/**
 * Recebe a encomenda da vitrine.
 *
 * Ordem das travas, da mais barata para a mais cara:
 *   1. honeypot   — campo escondido preenchido = robo, sai fingindo sucesso
 *   2. Zod        — formato dos dados
 *   3. limite/IP  — funcao pode_enviar_pedido no banco (5 por hora)
 *   4. RLS        — a policy do Postgres, que vale mesmo sem passar por aqui
 */
export async function criarPedido(
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const honeypot = String(formData.get("website") ?? "");

  // Robo: respondemos "deu certo" para ele nao tentar outra estrategia, mas
  // nada e gravado.
  if (honeypot.trim() !== "") {
    return sucesso("Pedido enviado!");
  }

  const produtoId = String(formData.get("produto_id") ?? "").trim();

  const analise = schemaPedido.safeParse({
    produto_id: produtoId === "" ? undefined : produtoId,
    nome: String(formData.get("nome") ?? ""),
    telefone: String(formData.get("telefone") ?? ""),
    email: String(formData.get("email") ?? ""),
    cidade: String(formData.get("cidade") ?? ""),
    mensagem: String(formData.get("mensagem") ?? ""),
    website: honeypot,
  });

  if (!analise.success) {
    return falha(
      "Confira os campos destacados.",
      analise.error.flatten().fieldErrors,
    );
  }

  const d = analise.data;
  const ipHash = await calcularHashDoIP();

  /*
   * Usamos a chave secreta aqui, e nao a publicavel, por um motivo concreto:
   * o visitante anonimo tem policy de INSERT, mas um vendedor logado que
   * estivesse navegando na vitrine NAO tem — e o pedido dele falharia sem
   * explicacao. A validacao que a policy faria (status novo, sem cliente
   * vinculado, tamanhos maximos) esta garantida pelo Zod logo acima e pelos
   * valores fixos abaixo. A policy do banco continua existindo como defesa
   * para quem tentar falar com o PostgREST direto.
   */
  const admin = criarClienteAdmin();

  const { data: liberado, error: erroLimite } = await admin.rpc(
    "pode_enviar_pedido",
    { p_ip_hash: ipHash },
  );

  if (erroLimite) return falha(traduzirErroDoBanco(erroLimite));

  if (liberado === false) {
    return falha(
      "Voce ja enviou varios pedidos na ultima hora. Fale com a gente pelo WhatsApp.",
    );
  }

  const { data, error } = await admin
    .from("pedidos")
    .insert({
      produto_id: d.produto_id ?? null,
      nome: d.nome,
      telefone: apenasDigitos(d.telefone),
      email: d.email ?? null,
      cidade: d.cidade ?? null,
      mensagem: d.mensagem ?? null,
      status: "novo",
      cliente_id: null,
      ip_hash: ipHash,
    })
    .select("id")
    .single();

  if (error) return falha(traduzirErroDoBanco(error));

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");

  return sucesso("Pedido enviado!", data.id);
}

/** Painel: muda o status do lead. */
export async function atualizarStatusPedido(formData: FormData): Promise<void> {
  const analise = schemaStatusPedido.safeParse({
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? ""),
  });

  if (!analise.success) return;

  const supabase = await criarClienteServidor();
  await supabase
    .from("pedidos")
    .update({ status: analise.data.status })
    .eq("id", analise.data.id);

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${analise.data.id}`);
  revalidatePath("/admin");
}

/**
 * Converte o lead em cliente do cadastro.
 *
 * Se ja existir alguem com o mesmo telefone, reaproveita — evita encher a
 * base de clientes duplicados quando a mesma pessoa pede dois equipamentos.
 * Depois disso a tela de nova venda abre com o cliente ja selecionado.
 */
export async function converterPedidoEmCliente(
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const id = String(formData.get("id") ?? "");
  if (!id) return falha("Pedido nao informado.");

  const supabase = await criarClienteServidor();

  const { data: pedido, error: erroPedido } = await supabase
    .from("pedidos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (erroPedido) return falha(traduzirErroDoBanco(erroPedido));
  if (!pedido) return falha("Pedido nao encontrado.");

  if (pedido.cliente_id) {
    return sucesso(
      "Este pedido ja esta ligado a um cliente.",
      pedido.cliente_id,
    );
  }

  const telefone = apenasDigitos(pedido.telefone);

  const { data: existente } = await supabase
    .from("clientes")
    .select("id")
    .eq("telefone", telefone)
    .maybeSingle();

  let clienteId = existente?.id ?? null;

  if (!clienteId) {
    const { data: novo, error } = await supabase
      .from("clientes")
      .insert({
        nome: pedido.nome,
        telefone,
        email: pedido.email,
        cidade: pedido.cidade,
        observacoes: pedido.mensagem
          ? `Veio pelo site: ${pedido.mensagem}`
          : "Veio pelo site.",
      })
      .select("id")
      .single();

    if (error) return falha(traduzirErroDoBanco(error));
    clienteId = novo.id;
  }

  await supabase
    .from("pedidos")
    .update({ cliente_id: clienteId, status: "em_contato" })
    .eq("id", id);

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin/clientes");

  return sucesso("Cliente criado a partir do pedido.", clienteId);
}
