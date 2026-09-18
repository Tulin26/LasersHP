"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/utils/supabase/server";
import { schemaConfiguracoes } from "@/lib/validacoes/configuracoes";
import { normalizarNumeroWhatsApp } from "@/lib/whatsapp";
import {
  falha,
  sucesso,
  traduzirErroDoBanco,
  type EstadoFormulario,
} from "@/lib/acoes/tipos";

/**
 * Salva os textos e contatos do site.
 *
 * A tabela `configuracoes` tem uma linha so, travada em id = 1 por um CHECK
 * no banco. Por isso e sempre UPDATE — nunca INSERT.
 *
 * O revalidatePath("/", "layout") no fim e importante: o nome do negocio e o
 * WhatsApp aparecem no cabecalho e no botao flutuante, que vivem no layout.
 * Sem invalidar o layout, o site continuaria mostrando o valor antigo ate a
 * proxima build.
 */
export async function salvarConfiguracoes(
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const analise = schemaConfiguracoes.safeParse({
    nome_negocio: String(formData.get("nome_negocio") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    email_contato: String(formData.get("email_contato") ?? ""),
    cidade: String(formData.get("cidade") ?? ""),
    instagram: String(formData.get("instagram") ?? ""),
    titulo_home: String(formData.get("titulo_home") ?? ""),
    subtitulo_home: String(formData.get("subtitulo_home") ?? ""),
    texto_sobre: String(formData.get("texto_sobre") ?? ""),
    seo_titulo: String(formData.get("seo_titulo") ?? ""),
    seo_descricao: String(formData.get("seo_descricao") ?? ""),
    og_imagem_url: String(formData.get("og_imagem_url") ?? ""),
  });

  if (!analise.success) {
    return falha(
      "Confira os campos destacados.",
      analise.error.flatten().fieldErrors,
    );
  }

  const d = analise.data;
  const supabase = await criarClienteServidor();

  const { error } = await supabase
    .from("configuracoes")
    .update({
      nome_negocio: d.nome_negocio,
      // Normaliza para o formato que o link wa.me exige (so digitos, com DDI).
      whatsapp: normalizarNumeroWhatsApp(d.whatsapp),
      email_contato: d.email_contato ?? null,
      cidade: d.cidade ?? null,
      instagram: d.instagram ?? null,
      titulo_home: d.titulo_home ?? "",
      subtitulo_home: d.subtitulo_home ?? "",
      texto_sobre: d.texto_sobre ?? null,
      seo_titulo: d.seo_titulo ?? null,
      seo_descricao: d.seo_descricao ?? null,
      og_imagem_url: d.og_imagem_url ?? null,
    })
    .eq("id", 1);

  if (error) return falha(traduzirErroDoBanco(error));

  revalidatePath("/", "layout");
  revalidatePath("/admin/configuracoes");

  return sucesso("Configuracoes salvas.");
}
