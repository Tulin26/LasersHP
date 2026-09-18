import { z } from "zod";
import {
  dataISO,
  dinheiro,
  textoOpcional,
  uuid,
} from "@/lib/validacoes/comuns";

const FORMAS = [
  "pix",
  "dinheiro",
  "cartao_credito",
  "cartao_debito",
  "boleto",
  "transferencia",
  "financiamento",
  "outro",
] as const;

const STATUS = ["pago", "pendente", "cancelado"] as const;

export const schemaItemVenda = z.object({
  produto_id: uuid,
  quantidade: z.coerce
    .number({ message: "Informe a quantidade" })
    .int("Quantidade tem que ser inteira")
    .min(1, "Quantidade minima e 1"),
  valor_unitario: dinheiro,
});

/**
 * Venda nova.
 *
 * Repare que NAO existe campo "total": quem calcula e o banco, na coluna
 * gerada `total = subtotal - desconto`. Se o total viesse do formulario, o
 * navegador poderia mandar qualquer numero. A regra "desconto nao passa do
 * subtotal" tambem e checada aqui (pra dar mensagem decente) e no Postgres
 * (pra valer de verdade).
 */
export const schemaVenda = z
  .object({
    data: dataISO,
    cliente_id: uuid,
    vendedor_id: uuid,
    pedido_id: uuid.optional().nullable(),
    itens: z.array(schemaItemVenda).min(1, "Adicione pelo menos um item"),
    desconto: dinheiro.default(0),
    forma_pagamento: z.enum(FORMAS),
    status: z.enum(STATUS),
    observacoes: textoOpcional(2000),
    /**
     * Importacao de planilha antiga nao deve mexer no estoque de hoje —
     * aqueles equipamentos ja sairam da prateleira meses atras.
     */
    baixar_estoque: z.boolean().default(true),
  })
  .refine(
    (v) => {
      const subtotal = v.itens.reduce(
        (soma, i) => soma + i.quantidade * i.valor_unitario,
        0,
      );
      return v.desconto <= subtotal;
    },
    { message: "O desconto nao pode passar do subtotal", path: ["desconto"] },
  );

export type DadosVenda = z.infer<typeof schemaVenda>;
export type DadosItemVenda = z.infer<typeof schemaItemVenda>;

/** Filtros da listagem de vendas (tambem usados pela exportacao do Excel). */
export const schemaFiltroVendas = z.object({
  de: dataISO.optional(),
  ate: dataISO.optional(),
  cliente_id: uuid.optional(),
  vendedor_id: uuid.optional(),
  status: z.enum(STATUS).optional(),
});

export type FiltroVendas = z.infer<typeof schemaFiltroVendas>;
