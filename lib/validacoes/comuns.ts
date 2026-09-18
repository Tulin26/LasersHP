import { z } from "zod";

/**
 * Pecas de validacao reaproveitadas pelos outros schemas.
 *
 * Por que Zod: o MESMO schema roda no navegador (feedback imediato) e no
 * servidor (a validacao que realmente vale). Em PHP voce validaria duas
 * vezes, em dois lugares, e correria o risco de as regras divergirem.
 *
 * O `z.infer<typeof X>` no fim de cada arquivo tira o tipo TypeScript do
 * proprio schema — regra e tipo nunca saem de sincronia.
 */

/**
 * Campos de formulario HTML chegam sempre como string, e um campo vazio
 * chega como "" (nunca como null). Este helper transforma "" em undefined
 * para que `.optional()` funcione como voce espera.
 */
export const textoOpcional = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Use no maximo ${max} caracteres`)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

/** Telefone: guardamos so digitos, aceitando com ou sem DDI. */
export const telefone = z
  .string()
  .trim()
  .min(8, "Telefone muito curto")
  .max(20, "Telefone muito longo")
  .refine((v) => {
    const d = v.replace(/\D/g, "");
    return d.length >= 10 && d.length <= 13;
  }, "Informe DDD e numero, ex.: (44) 99999-8888");

/** E-mail opcional: aceita vazio, mas se vier preenchido tem que ser valido. */
export const emailOpcional = z
  .string()
  .trim()
  .max(160, "E-mail muito longo")
  .optional()
  .transform((v) => (v === "" ? undefined : v))
  .refine(
    (v) => v === undefined || z.string().email().safeParse(v).success,
    "E-mail invalido",
  );

/**
 * Dinheiro vindo de <input type="number">.
 *
 * z.coerce converte a string "15000.50" em numero antes de validar. Sem isso
 * o schema receberia texto e reclamaria de tipo.
 */
export const dinheiro = z.coerce
  .number({ message: "Informe um valor numerico" })
  .min(0, "O valor nao pode ser negativo")
  .max(99999999.99, "Valor acima do limite");

export const inteiroNaoNegativo = z.coerce
  .number({ message: "Informe um numero" })
  .int("Use um numero inteiro")
  .min(0, "Nao pode ser negativo");

/** Data no formato do Postgres. */
export const dataISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida");

export const uuid = z.string().uuid("Identificador invalido");

/** Checkbox de formulario: quando marcado vem "on", quando nao vem nada. */
export const booleanoDeFormulario = z
  .union([
    z.boolean(),
    z.literal("on"),
    z.literal("true"),
    z.literal("false"),
    z.undefined(),
  ])
  .transform((v) => v === true || v === "on" || v === "true");

/**
 * CPF/CNPJ opcional. Nao valida digito verificador de proposito: o primo pode
 * precisar cadastrar um documento estrangeiro ou incompleto na correria, e
 * travar a venda por causa disso seria pior que aceitar.
 */
export const documentoOpcional = z
  .string()
  .trim()
  .max(20, "Documento muito longo")
  .optional()
  .transform((v) => {
    if (!v) return undefined;
    const d = v.replace(/\D/g, "");
    return d === "" ? undefined : d;
  });
