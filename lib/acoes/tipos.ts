/**
 * Formato unico de resposta das Server Actions.
 *
 * Toda acao devolve este objeto, e os formularios leem sempre os mesmos
 * campos. O `useActionState` do React guarda o ultimo estado devolvido e
 * re-renderiza a tela com ele — e assim que a mensagem de erro aparece
 * debaixo do campo certo sem nenhum fetch escrito a mao.
 *
 * `erros` vem direto do Zod: { email: ["E-mail invalido"] }.
 */
export type EstadoFormulario = {
  ok: boolean;
  mensagem?: string;
  erros?: Record<string, string[] | undefined>;
  /** Preenchido quando a acao cria algo e a tela precisa do id. */
  id?: string;
};

export const ESTADO_INICIAL: EstadoFormulario = { ok: false };

/** Atalho para devolver erro sem repetir o objeto inteiro. */
export function falha(
  mensagem: string,
  erros?: Record<string, string[] | undefined>,
): EstadoFormulario {
  return { ok: false, mensagem, erros };
}

export function sucesso(mensagem: string, id?: string): EstadoFormulario {
  return { ok: true, mensagem, id };
}

/**
 * Traduz os erros do Postgres em mensagens que o primo entende.
 *
 * As exceptions com codigo P0001 vem das nossas funcoes SQL
 * (ESTOQUE_INSUFICIENTE, VENDA_SEM_ITENS...). As outras sao do proprio
 * Postgres: 23505 = valor duplicado, 23503 = registro ainda referenciado.
 */
export function traduzirErroDoBanco(erro: {
  code?: string;
  message?: string;
}): string {
  const msg = erro.message ?? "";

  if (msg.includes("ESTOQUE_INSUFICIENTE")) {
    return "Nao ha estoque suficiente para um dos equipamentos desta venda.";
  }
  if (msg.includes("VENDA_SEM_ITENS")) {
    return "Adicione pelo menos um equipamento antes de salvar.";
  }
  if (msg.includes("QUANTIDADE_INVALIDA")) {
    return "A quantidade precisa ser maior que zero.";
  }
  if (msg.includes("SEM_PERMISSAO")) {
    return "Seu usuario nao tem permissao para esta operacao.";
  }
  if (msg.includes("desconto_nao_passa_do_subtotal")) {
    return "O desconto nao pode ser maior que o valor dos itens.";
  }
  if (msg.includes("clientes_documento_idx")) {
    return "Ja existe um cliente cadastrado com este CPF/CNPJ.";
  }
  if (msg.includes("produtos_slug_key")) {
    return "Ja existe um equipamento com este nome. Mude o nome ou o modelo.";
  }

  switch (erro.code) {
    case "23505":
      return "Este registro ja existe.";
    case "23503":
      return "Nao da para excluir: existem registros ligados a este.";
    case "42501":
      return "Seu usuario nao tem permissao para esta operacao.";
    case "PGRST205":
      return "As tabelas ainda nao foram criadas no Supabase. Rode o arquivo supabase/migrations/0001_schema_inicial.sql.";
    default:
      return msg || "Nao foi possivel concluir a operacao.";
  }
}
