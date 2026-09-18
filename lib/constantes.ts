import type {
  FormaPagamento,
  StatusPedido,
  StatusVenda,
} from "@/lib/tipos/database.types";

/**
 * Rotulos e cores dos enums do banco.
 *
 * O banco guarda 'em_contato'; a tela mostra 'Em contato'. Centralizar isso
 * aqui evita que cada pagina invente a propria traducao — e, se amanha entrar
 * um status novo no SQL, o TypeScript aponta exatamente os lugares que faltam
 * atualizar (por causa do `Record<StatusPedido, ...>`, que exige todas as
 * chaves do tipo).
 */

type Rotulo = { texto: string; classe: string };

export const STATUS_PEDIDO: Record<StatusPedido, Rotulo> = {
  novo: {
    texto: "Novo",
    classe: "bg-blue-100 text-blue-800 border-blue-200",
  },
  em_contato: {
    texto: "Em contato",
    classe: "bg-amber-100 text-amber-800 border-amber-200",
  },
  fechado: {
    texto: "Fechado",
    classe: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  cancelado: {
    texto: "Cancelado",
    classe: "bg-neutral-100 text-neutral-600 border-neutral-200",
  },
};

export const STATUS_VENDA: Record<StatusVenda, Rotulo> = {
  pago: {
    texto: "Pago",
    classe: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  pendente: {
    texto: "Pendente",
    classe: "bg-amber-100 text-amber-800 border-amber-200",
  },
  cancelado: {
    texto: "Cancelado",
    classe: "bg-neutral-100 text-neutral-600 border-neutral-200",
  },
};

export const FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartao de credito",
  cartao_debito: "Cartao de debito",
  boleto: "Boleto",
  transferencia: "Transferencia",
  financiamento: "Financiamento",
  outro: "Outro",
};

/** Listas prontas para alimentar os <Select> dos formularios. */
export const OPCOES_STATUS_PEDIDO = Object.entries(STATUS_PEDIDO).map(
  ([valor, { texto }]) => ({ valor: valor as StatusPedido, texto }),
);

export const OPCOES_STATUS_VENDA = Object.entries(STATUS_VENDA).map(
  ([valor, { texto }]) => ({ valor: valor as StatusVenda, texto }),
);

export const OPCOES_FORMA_PAGAMENTO = Object.entries(FORMA_PAGAMENTO).map(
  ([valor, texto]) => ({ valor: valor as FormaPagamento, texto }),
);

/** Bucket do Supabase Storage onde ficam as fotos dos equipamentos. */
export const BUCKET_PRODUTOS = "produtos";

/** Limite de upload. Foto de catalogo nao precisa de mais que isso. */
export const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024; // 5 MB

export const TIPOS_IMAGEM_ACEITOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
