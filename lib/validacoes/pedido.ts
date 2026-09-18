import { z } from "zod";
import {
  emailOpcional,
  telefone,
  textoOpcional,
} from "@/lib/validacoes/comuns";

/**
 * Formulario de encomenda da vitrine.
 *
 * Os limites de tamanho aqui sao os MESMOS que estao no `with check` da policy
 * "qualquer um pode enviar pedido" no SQL. Isso e de proposito: se alguem
 * burlar o JavaScript e mandar a requisicao na mao, o Postgres recusa do
 * mesmo jeito. O Zod da a mensagem bonita; o banco e a trava de verdade.
 */
export const schemaPedido = z.object({
  produto_id: z.string().uuid().optional(),

  nome: z
    .string()
    .trim()
    .min(2, "Informe seu nome")
    .max(120, "Nome muito longo"),

  telefone,
  email: emailOpcional,
  cidade: textoOpcional(120),
  mensagem: textoOpcional(2000),

  /**
   * Campo-armadilha (honeypot).
   *
   * Fica escondido no CSS: gente de verdade nunca ve e nunca preenche. Robo
   * que preenche tudo que encontra no HTML cai aqui. Se vier com conteudo,
   * fingimos que deu certo e nao gravamos nada.
   */
  website: z.string().max(0).optional(),
});

export type DadosPedido = z.infer<typeof schemaPedido>;

/** Mudanca de status pelo painel. */
export const schemaStatusPedido = z.object({
  id: z.string().uuid(),
  status: z.enum(["novo", "em_contato", "fechado", "cancelado"]),
});
