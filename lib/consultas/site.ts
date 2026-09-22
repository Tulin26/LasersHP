import { cache } from "react";
import { criarClienteServidor } from "@/utils/supabase/server";
import type { Configuracoes, Produto } from "@/lib/tipos/database.types";

/**
 * Consultas da vitrine publica.
 *
 * Todas rodam em Server Component: o SQL acontece no servidor da Vercel e o
 * navegador recebe so o HTML pronto. A chave publicavel vai junto, mas nao
 * tem problema — o RLS so libera produtos ativos e as configuracoes.
 *
 * O `cache()` do React (nao confundir com cache de disco) memoriza a chamada
 * DENTRO de uma mesma renderizacao. O layout e a pagina pedem as
 * configuracoes; sem isso seriam duas viagens ao banco para o mesmo dado.
 */


/**
 * Colunas que a vitrine pede ao banco.
 *
 * Antes aqui era `select("*")`. Duas razoes para ter virado lista explicita:
 *
 * 1. O visitante anonimo NAO tem mais permissao de ler `estoque` e
 *    `estoque_minimo` (migracao 0004) — quantas unidades existem e informacao
 *    interna. Com `*` o PostgREST pede todas as colunas e leva um 42501.
 * 2. Mesmo que pudesse, mandar coluna que a tela nao usa e desperdicio: sai
 *    do banco, atravessa a rede e e descartada.
 *
 * `disponivel` e uma coluna gerada (estoque > 0): diz se ha unidade sem
 * revelar quantas.
 */
const COLUNAS_PUBLICAS =
  "id, slug, nome, modelo, descricao, indicacoes, preco, preco_sob_consulta, imagens, ativo, destaque, criado_em, disponivel, area, comprimento_onda";

/** O que a vitrine conhece de um equipamento — sem os campos de estoque. */
export type ProdutoPublico = Omit<Produto, "estoque" | "estoque_minimo" | "atualizado_em">;

/** Valores usados enquanto o primo nao preencher a tela de configuracoes. */
const CONFIGURACOES_PADRAO: Configuracoes = {
  id: 1,
  nome_negocio: "LaserHP",
  whatsapp: "",
  email_contato: null,
  cidade: null,
  instagram: null,
  instagram_secundario: null,
  titulo_home: "Equipamentos de laser para estetica",
  subtitulo_home:
    "Tecnologia profissional para clinicas e esteticistas, com suporte de quem entende do assunto.",
  texto_sobre: null,
  seo_titulo: null,
  seo_descricao: null,
  og_imagem_url: null,
  atualizado_em: new Date().toISOString(),
};

export const buscarConfiguracoes = cache(async (): Promise<Configuracoes> => {
  const supabase = await criarClienteServidor();

  const { data } = await supabase
    .from("configuracoes")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  // Se o banco ainda nao foi criado, o site abre com os textos padrao em vez
  // de estourar um erro na cara do visitante.
  if (!data) return CONFIGURACOES_PADRAO;

  return {
    ...data,
    titulo_home: data.titulo_home || CONFIGURACOES_PADRAO.titulo_home,
    subtitulo_home: data.subtitulo_home || CONFIGURACOES_PADRAO.subtitulo_home,
  };
});

/** Catalogo: so produtos ativos. O RLS ja filtra, o .eq e cinto e suspensorio. */
export const listarProdutosPublicos = cache(
  async (busca?: string): Promise<ProdutoPublico[]> => {
    const supabase = await criarClienteServidor();

    let consulta = supabase
      .from("produtos")
      .select(COLUNAS_PUBLICAS)
      .eq("ativo", true)
      .order("destaque", { ascending: false })
      .order("nome", { ascending: true });

    if (busca?.trim()) {
      // ilike = LIKE sem diferenciar maiuscula/minuscula.
      const termo = `%${busca.trim()}%`;
      consulta = consulta.or(
        `nome.ilike.${termo},modelo.ilike.${termo},descricao.ilike.${termo}`,
      );
    }

    const { data, error } = await consulta;
    if (error) return [];
    return data ?? [];
  },
);

export const listarDestaques = cache(async (limite = 3): Promise<ProdutoPublico[]> => {
  const supabase = await criarClienteServidor();

  const { data } = await supabase
    .from("produtos")
    .select(COLUNAS_PUBLICAS)
    .eq("ativo", true)
    .eq("destaque", true)
    .order("nome")
    .limit(limite);

  if (data && data.length > 0) return data;

  // Sem destaque marcado, mostra os mais recentes para a home nao ficar vazia.
  const { data: recentes } = await supabase
    .from("produtos")
    .select(COLUNAS_PUBLICAS)
    .eq("ativo", true)
    .order("criado_em", { ascending: false })
    .limit(limite);

  return recentes ?? [];
});

export const buscarProdutoPorSlug = cache(
  async (slug: string): Promise<ProdutoPublico | null> => {
    const supabase = await criarClienteServidor();

    const { data } = await supabase
      .from("produtos")
      .select(COLUNAS_PUBLICAS)
      .eq("slug", slug)
      .eq("ativo", true)
      .maybeSingle();

    return data ?? null;
  },
);

/** Usado pelo generateStaticParams do detalhe do equipamento. */
export async function listarSlugsPublicos(): Promise<string[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("produtos")
    .select("slug")
    .eq("ativo", true);
  return (data ?? []).map((p) => p.slug);
}
