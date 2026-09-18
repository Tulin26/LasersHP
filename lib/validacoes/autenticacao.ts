import { z } from "zod";

/** Login do painel. */
export const schemaLogin = z.object({
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail invalido"),
  senha: z.string().min(6, "A senha tem no minimo 6 caracteres"),
  /** Para onde voltar depois de entrar (preenchido pelo proxy.ts). */
  redirecionar: z.string().optional(),
});

export type DadosLogin = z.infer<typeof schemaLogin>;
