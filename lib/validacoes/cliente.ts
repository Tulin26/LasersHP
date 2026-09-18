import { z } from "zod";
import {
  documentoOpcional,
  emailOpcional,
  textoOpcional,
} from "@/lib/validacoes/comuns";

export const schemaCliente = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(120, "Nome muito longo"),
  telefone: textoOpcional(20),
  email: emailOpcional,
  documento: documentoOpcional,
  cidade: textoOpcional(120),
  observacoes: textoOpcional(2000),
});

export type DadosCliente = z.infer<typeof schemaCliente>;

export const schemaVendedor = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(120, "Nome muito longo"),
  telefone: textoOpcional(20),
  email: emailOpcional,
  observacoes: textoOpcional(2000),
  ativo: z
    .union([z.boolean(), z.literal("on"), z.undefined()])
    .transform((v) => v === true || v === "on"),
});

export type DadosVendedor = z.infer<typeof schemaVendedor>;
