"use server";

import { randomUUID } from "node:crypto";
import { buscarSessao } from "@/lib/consultas/painel";
import { criarClienteServidor } from "@/utils/supabase/server";
import { BUCKET_PRODUTOS } from "@/lib/constantes";

/**
 * Prepara o envio de uma foto para o Storage.
 *
 * ---------------------------------------------------------------------------
 * Por que isto passou a existir
 * ---------------------------------------------------------------------------
 * Antes o navegador criava um cliente do Supabase COM A SESSAO do usuario e
 * mandava o arquivo direto. Para isso funcionar, o cookie de sessao precisava
 * ser legivel por JavaScript — e um cookie legivel por JavaScript e um cookie
 * que qualquer falha de XSS consegue roubar. Como aquele cookie carrega o
 * refresh token, roubar uma vez daria acesso duradouro.
 *
 * Agora o cookie e `httpOnly` (fora do alcance do JavaScript) e o envio
 * funciona assim:
 *
 *   1. o navegador diz ao servidor "quero mandar um arquivo deste tipo";
 *   2. o servidor confere que quem pediu e admin e devolve um TOKEN que vale
 *      para UM caminho especifico e por pouco tempo;
 *   3. o navegador manda o arquivo direto para o Supabase usando esse token,
 *      sem sessao nenhuma.
 *
 * O arquivo continua sem passar pela Vercel — que era a razao original de
 * enviar pelo navegador, ja que funcao serverless tem limite de tempo e de
 * tamanho de corpo. O que mudou e que o navegador deixou de carregar uma
 * credencial ampla e passou a receber uma permissao estreita e descartavel.
 *
 * De quebra resolve outra coisa: a extensao do arquivo agora sai do TIPO
 * declarado e validado aqui no servidor, nao do nome que o usuario mandou.
 * Antes, `arquivo.name.split(".").pop()` aceitava qualquer coisa — inclusive
 * `.html`, num bucket publico.
 */

/** Unico lugar que decide qual extensao cada tipo de imagem recebe. */
const EXTENSAO_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export type PreparoDeUpload =
  | { ok: true; caminho: string; token: string }
  | { ok: false; erro: string };

export async function prepararUploadDeImagem(
  tipo: string,
): Promise<PreparoDeUpload> {
  // Nao usamos exigirAdmin() aqui porque ela responde com redirect(), que e o
  // certo numa PAGINA mas estranho numa acao chamada por JavaScript: o
  // componente quer uma mensagem para mostrar na tela, nao uma navegacao.
  const sessao = await buscarSessao();

  if (!sessao) return { ok: false, erro: "Sua sessao expirou. Entre de novo." };
  if (!sessao.ehAdmin) {
    return { ok: false, erro: "Apenas administradores enviam fotos." };
  }

  const extensao = EXTENSAO_POR_TIPO[tipo];
  if (!extensao) {
    return { ok: false, erro: "Use JPG, PNG, WebP ou AVIF." };
  }

  // Nome aleatorio: duas fotos "frente.jpg" nao podem se sobrescrever, e o
  // nome original do arquivo nunca chega ao bucket (ele pode conter o nome
  // de uma pasta da maquina de quem enviou).
  const caminho = `${randomUUID()}.${extensao}`;

  const supabase = await criarClienteServidor();

  const { data, error } = await supabase.storage
    .from(BUCKET_PRODUTOS)
    .createSignedUploadUrl(caminho);

  if (error || !data) {
    return {
      ok: false,
      erro: "Nao foi possivel preparar o envio. Tente de novo.",
    };
  }

  return { ok: true, caminho: data.path, token: data.token };
}

/**
 * Apaga uma foto do bucket.
 *
 * Tambem virou acao de servidor pelo mesmo motivo do envio: o navegador nao
 * tem mais uma sessao capaz de escrever no Storage. Aqui a conferencia de
 * admin e obrigatoria — sem ela, qualquer pessoa logada poderia apagar as
 * fotos do catalogo inteiro chamando esta funcao com caminhos adivinhados.
 */
export async function removerImagem(caminho: string): Promise<void> {
  const sessao = await buscarSessao();
  if (!sessao?.ehAdmin) return;

  // Aceita apenas o formato que nos mesmos geramos (uuid.extensao). Barra
  // travessia de caminho, do tipo "../outro-bucket/arquivo".
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|avif)$/i.test(caminho)) return;

  const supabase = await criarClienteServidor();
  await supabase.storage.from(BUCKET_PRODUTOS).remove([caminho]);
}
