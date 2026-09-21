import { cache } from "react";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/utils/supabase/server";
import { primeiroDiaDoMes, ultimoDiaDoMes } from "@/lib/formatar";
import type {
  Cliente,
  PedidoCompleto,
  Perfil,
  Produto,
  StatusVenda,
  Vendedor,
  VendaCompleta,
} from "@/lib/tipos/database.types";
import type { FiltroVendas } from "@/lib/validacoes/venda";

/**
 * Consultas e guarda de acesso do painel.
 *
 * Por que checar o usuario aqui, se o proxy.ts ja redireciona quem nao esta
 * logado? Porque a documentacao do Next 16 e explicita: o proxy serve para
 * checagem OTIMISTA. Ele le o cookie, mas nao e a fonte da verdade — e uma
 * requisicao direta a um Server Component pode nao passar por ele.
 *
 * Entao a autorizacao de verdade acontece em tres camadas:
 *   1. proxy.ts          -> experiencia: redireciona rapido
 *   2. exigirSessao()    -> garante usuario e papel na renderizacao
 *   3. RLS no Postgres   -> a ultima palavra, mesmo se 1 e 2 falharem
 */

export type Sessao = {
  usuarioId: string;
  email: string;
  perfil: Perfil | null;
  ehAdmin: boolean;
  /** id na tabela vendedores, quando o usuario for um vendedor com login */
  vendedorId: string | null;
};

export const buscarSessao = cache(async (): Promise<Sessao | null> => {
  const supabase = await criarClienteServidor();

  // getUser() valida o token no servidor do Supabase. Nunca use getSession()
  // para autorizar: ele so le o cookie, que o navegador poderia ter forjado.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: vendedor } = await supabase
    .from("vendedores")
    .select("id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  return {
    usuarioId: user.id,
    email: user.email ?? "",
    perfil: perfil ?? null,
    ehAdmin: perfil?.papel === "admin",
    vendedorId: vendedor?.id ?? null,
  };
});

/** Use no topo de toda pagina do /admin. */
export async function exigirSessao(): Promise<Sessao> {
  const sessao = await buscarSessao();
  if (!sessao) redirect("/login?redirecionar=%2Fadmin");
  return sessao;
}

/** Telas que so o admin pode abrir (produtos, configuracoes, vendedores). */
export async function exigirAdmin(): Promise<Sessao> {
  const sessao = await exigirSessao();
  if (!sessao.ehAdmin) redirect("/admin?erro=sem-permissao");
  return sessao;
}

// ---------------------------------------------------------------------------
// PRODUTOS
// ---------------------------------------------------------------------------

export async function listarProdutos(busca?: string): Promise<Produto[]> {
  const supabase = await criarClienteServidor();

  let consulta = supabase.from("produtos").select("*").order("nome");

  if (busca?.trim()) {
    const termo = `%${busca.trim()}%`;
    consulta = consulta.or(`nome.ilike.${termo},modelo.ilike.${termo}`);
  }

  const { data } = await consulta;
  return data ?? [];
}

export async function buscarProduto(id: string): Promise<Produto | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("produtos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

/** Produtos no ou abaixo do minimo — alimenta o alerta do dashboard. */
export async function listarEstoqueBaixo(): Promise<Produto[]> {
  const supabase = await criarClienteServidor();

  // O PostgREST nao compara duas colunas entre si, entao filtramos aqui.
  const { data } = await supabase
    .from("produtos")
    .select("*")
    .eq("ativo", true)
    .order("estoque");

  return (data ?? []).filter((p) => p.estoque <= p.estoque_minimo);
}

// ---------------------------------------------------------------------------
// PEDIDOS (leads da vitrine)
// ---------------------------------------------------------------------------

export async function listarPedidos(
  status?: string,
): Promise<PedidoCompleto[]> {
  const supabase = await criarClienteServidor();

  let consulta = supabase
    .from("pedidos")
    .select("*, produtos(id, nome, modelo, slug)")
    .order("criado_em", { ascending: false });

  if (status && status !== "todos") {
    consulta = consulta.eq(
      "status",
      status as "novo" | "em_contato" | "fechado" | "cancelado",
    );
  }

  const { data } = await consulta.returns<PedidoCompleto[]>();
  return data ?? [];
}

export async function buscarPedido(id: string): Promise<PedidoCompleto | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("pedidos")
    .select("*, produtos(id, nome, modelo, slug)")
    .eq("id", id)
    .maybeSingle<PedidoCompleto>();
  return data ?? null;
}

export async function contarPedidosNovos(): Promise<number> {
  const supabase = await criarClienteServidor();
  const { count } = await supabase
    .from("pedidos")
    .select("id", { count: "exact", head: true })
    .eq("status", "novo");
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// CLIENTES E VENDEDORES
// ---------------------------------------------------------------------------

export async function listarClientes(busca?: string): Promise<Cliente[]> {
  const supabase = await criarClienteServidor();

  let consulta = supabase.from("clientes").select("*").order("nome");

  if (busca?.trim()) {
    const termo = `%${busca.trim()}%`;
    consulta = consulta.or(
      `nome.ilike.${termo},telefone.ilike.${termo},documento.ilike.${termo},cidade.ilike.${termo}`,
    );
  }

  const { data } = await consulta;
  return data ?? [];
}

export async function buscarCliente(id: string): Promise<Cliente | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

/** Historico de compras de um cliente. */
export async function listarVendasDoCliente(
  clienteId: string,
): Promise<VendaCompleta[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("vendas")
    .select(
      "*, clientes(id, nome, telefone, cidade), vendedores(id, nome), venda_itens(*, produtos(id, nome, modelo))",
    )
    .eq("cliente_id", clienteId)
    .order("data", { ascending: false })
    .returns<VendaCompleta[]>();
  return data ?? [];
}

export async function listarVendedores(
  apenasAtivos = false,
): Promise<Vendedor[]> {
  const supabase = await criarClienteServidor();

  let consulta = supabase.from("vendedores").select("*").order("nome");
  if (apenasAtivos) consulta = consulta.eq("ativo", true);

  const { data } = await consulta;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// VENDAS
// ---------------------------------------------------------------------------

const SELECT_VENDA_COMPLETA =
  "*, clientes(id, nome, telefone, cidade), vendedores(id, nome), venda_itens(*, produtos(id, nome, modelo))";

/**
 * Listagem com filtros.
 *
 * Nao existe filtro "so as minhas vendas": isso ja vem do RLS. Se um vendedor
 * abrir esta tela, o Postgres devolve apenas as vendas dele — a aplicacao nem
 * precisa saber que existe essa regra.
 */
export async function listarVendas(
  filtro: FiltroVendas = {},
): Promise<VendaCompleta[]> {
  const supabase = await criarClienteServidor();

  let consulta = supabase
    .from("vendas")
    .select(SELECT_VENDA_COMPLETA)
    .order("data", { ascending: false })
    .order("criado_em", { ascending: false });

  if (filtro.de) consulta = consulta.gte("data", filtro.de);
  if (filtro.ate) consulta = consulta.lte("data", filtro.ate);
  if (filtro.cliente_id)
    consulta = consulta.eq("cliente_id", filtro.cliente_id);
  if (filtro.vendedor_id)
    consulta = consulta.eq("vendedor_id", filtro.vendedor_id);
  if (filtro.status) consulta = consulta.eq("status", filtro.status);

  const { data } = await consulta.returns<VendaCompleta[]>();
  return data ?? [];
}

export async function buscarVenda(id: string): Promise<VendaCompleta | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("vendas")
    .select(SELECT_VENDA_COMPLETA)
    .eq("id", id)
    .maybeSingle<VendaCompleta>();
  return data ?? null;
}

/**
 * Formato enxuto usado pelo carrossel do painel.
 *
 * Por que um tipo proprio em vez de reaproveitar VendaCompleta: o carrossel
 * e um Client Component, e tudo que um servidor passa para o cliente viaja
 * pela rede dentro do HTML. Mandar a venda inteira (todos os itens, todos os
 * campos do cliente) so para mostrar quatro informacoes num card seria peso
 * morto em cada carregamento do painel.
 */
export type VendaResumida = {
  id: string;
  data: string;
  total: number;
  status: StatusVenda;
  cliente: string;
  vendedor: string;
  /** Ex.: "2x Laser 808nm, 1x IPL Pro" */
  itens: string;
};

/**
 * Ultimas vendas registradas, sem recorte de periodo.
 *
 * Continua valendo o RLS: se um vendedor abrir o painel, o carrossel mostra
 * apenas as vendas dele. Nao existe filtro no codigo para isso — a regra
 * mora no banco.
 */
export async function listarVendasRecentes(
  limite = 12,
): Promise<VendaResumida[]> {
  const supabase = await criarClienteServidor();

  const { data } = await supabase
    .from("vendas")
    .select(SELECT_VENDA_COMPLETA)
    .order("data", { ascending: false })
    .order("criado_em", { ascending: false })
    .limit(limite)
    .returns<VendaCompleta[]>();

  return (data ?? []).map((v) => ({
    id: v.id,
    data: v.data,
    total: Number(v.total ?? 0),
    status: v.status,
    cliente: v.clientes?.nome ?? "Cliente removido",
    vendedor: v.vendedores?.nome ?? "—",
    itens:
      v.venda_itens
        .map((i) => `${i.quantidade}x ${i.produtos?.nome ?? "Equipamento"}`)
        .join(", ") || "Sem itens",
  }));
}

// ---------------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------------

export type ResumoDashboard = {
  totalMes: number;
  quantidadeMes: number;
  ticketMedio: number;
  pedidosNovos: number;
  porVendedor: { nome: string; total: number; quantidade: number }[];
  maisVendidos: { nome: string; quantidade: number; total: number }[];
  estoqueBaixo: Produto[];
};

export async function montarDashboard(): Promise<ResumoDashboard> {
  const de = primeiroDiaDoMes();
  const ate = ultimoDiaDoMes();

  // Vendas canceladas nao entram em nenhum numero do dashboard.
  const vendas = (await listarVendas({ de, ate })).filter(
    (v) => v.status !== "cancelado",
  );

  const totalMes = vendas.reduce((s, v) => s + Number(v.total ?? 0), 0);
  const quantidadeMes = vendas.length;

  // Agrupamentos feitos em memoria de proposito: o volume de um negocio deste
  // tamanho e pequeno, e uma view materializada no banco seria manutencao
  // extra sem ganho real. Se um dia passar de alguns milhares de vendas por
  // mes, vale mover isto para uma funcao SQL.
  const mapaVendedor = new Map<string, { total: number; quantidade: number }>();
  for (const v of vendas) {
    const nome = v.vendedores?.nome ?? "Sem vendedor";
    const atual = mapaVendedor.get(nome) ?? { total: 0, quantidade: 0 };
    atual.total += Number(v.total ?? 0);
    atual.quantidade += 1;
    mapaVendedor.set(nome, atual);
  }

  const mapaProduto = new Map<string, { quantidade: number; total: number }>();
  for (const v of vendas) {
    for (const item of v.venda_itens ?? []) {
      const nome = item.produtos?.nome ?? "Produto removido";
      const atual = mapaProduto.get(nome) ?? { quantidade: 0, total: 0 };
      atual.quantidade += item.quantidade;
      atual.total += Number(item.subtotal ?? 0);
      mapaProduto.set(nome, atual);
    }
  }

  const [pedidosNovos, estoqueBaixo] = await Promise.all([
    contarPedidosNovos(),
    listarEstoqueBaixo(),
  ]);

  return {
    totalMes,
    quantidadeMes,
    ticketMedio: quantidadeMes > 0 ? totalMes / quantidadeMes : 0,
    pedidosNovos,
    porVendedor: [...mapaVendedor.entries()]
      .map(([nome, d]) => ({ nome, ...d }))
      .sort((a, b) => b.total - a.total),
    maisVendidos: [...mapaProduto.entries()]
      .map(([nome, d]) => ({ nome, ...d }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5),
    estoqueBaixo,
  };
}
