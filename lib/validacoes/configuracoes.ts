import { z } from "zod";
import { emailOpcional, textoOpcional } from "@/lib/validacoes/comuns";

/**
 * Configuracoes do site, editaveis pelo painel.
 *
 * O WhatsApp e o unico campo realmente obrigatorio: sem ele o botao flutuante
 * e o redirecionamento da encomenda ficam quebrados, que e justamente o
 * caminho pelo qual o cliente chega no primo.
 */
export const schemaConfiguracoes = z.object({
  nome_negocio: z
    .string()
    .trim()
    .min(2, "Informe o nome do negocio")
    .max(120, "Nome muito longo"),

  whatsapp: z
    .string()
    .trim()
    .min(10, "Informe o WhatsApp com DDD")
    .max(20, "Numero muito longo")
    .refine((v) => {
      const d = v.replace(/\D/g, "");
      return d.length >= 10 && d.length <= 13;
    }, "Numero invalido. Ex.: (44) 99999-8888"),

  email_contato: emailOpcional,
  cidade: textoOpcional(120),
  instagram: textoOpcional(120),
  instagram_secundario: textoOpcional(120),

  titulo_home: textoOpcional(160),
  subtitulo_home: textoOpcional(300),
  texto_sobre: textoOpcional(4000),

  seo_titulo: textoOpcional(120),
  seo_descricao: textoOpcional(320),
  og_imagem_url: textoOpcional(500),
});

export type DadosConfiguracoes = z.infer<typeof schemaConfiguracoes>;
