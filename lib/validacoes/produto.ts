import { z } from "zod";
import {
  booleanoDeFormulario,
  dinheiro,
  inteiroNaoNegativo,
  textoOpcional,
} from "@/lib/validacoes/comuns";

/**
 * Cadastro de equipamento.
 *
 * A regra de negocio que o schema carrega: ou o produto tem preco, ou esta
 * marcado como "sob consulta". Deixar os dois vazios geraria um card na
 * vitrine sem informacao nenhuma de valor — por isso o `.refine()` no fim,
 * que so roda depois que cada campo individual passou.
 */
export const schemaProduto = z
  .object({
    nome: z
      .string()
      .trim()
      .min(2, "Informe o nome do equipamento")
      .max(120, "Nome muito longo"),
    modelo: textoOpcional(80),
    descricao: textoOpcional(4000),
    indicacoes: textoOpcional(4000),

    // Ficha tecnica: e o que a vitrine alinha em coluna ao lado do aparelho.
    // Tudo opcional de proposito — um cadastro pela metade nao pode impedir o
    // equipamento de entrar no ar; a vitrine simplesmente omite a linha vazia.
    aplicacao: textoOpcional(40),
    potencia: textoOpcional(40),
    comprimento_onda: textoOpcional(60),
    emite_vermelho: booleanoDeFormulario,
    emite_infravermelho: booleanoDeFormulario,

    preco: z
      .union([dinheiro, z.literal("")])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : Number(v))),
    preco_sob_consulta: booleanoDeFormulario,

    estoque: inteiroNaoNegativo,
    estoque_minimo: inteiroNaoNegativo,

    /** Caminhos no Storage. A posicao 0 e a foto de capa. */
    imagens: z.array(z.string()).default([]),

    ativo: booleanoDeFormulario,
    destaque: booleanoDeFormulario,
  })
  .refine((d) => d.preco_sob_consulta || (d.preco !== null && d.preco > 0), {
    message: 'Informe o preco ou marque "mostrar sob consulta"',
    path: ["preco"],
  });

export type DadosProduto = z.infer<typeof schemaProduto>;
