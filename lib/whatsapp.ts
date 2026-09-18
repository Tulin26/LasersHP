import { apenasDigitos } from "@/lib/formatar";

/**
 * Monta o link do WhatsApp.
 *
 * O formato https://wa.me/<numero>?text=<mensagem> e o oficial e funciona
 * tanto no celular (abre o app) quanto no computador (abre o WhatsApp Web).
 * O numero precisa ir so com digitos e COM o DDI: 5544999998888.
 */
export function montarLinkWhatsApp(
  numero: string | null | undefined,
  mensagem?: string,
): string {
  const limpo = normalizarNumeroWhatsApp(numero);
  const base = `https://wa.me/${limpo}`;
  if (!mensagem) return base;
  // encodeURIComponent cuida de acentos, quebras de linha e do "&".
  return `${base}?text=${encodeURIComponent(mensagem)}`;
}

/**
 * Garante o DDI 55 na frente.
 *
 * Se o primo digitar "44 99999-8888" nas configuracoes, o link ainda precisa
 * sair certo — entao completamos o 55 quando o numero tem cara de brasileiro
 * (10 digitos com fixo, 11 com celular).
 */
export function normalizarNumeroWhatsApp(
  numero: string | null | undefined,
): string {
  const d = apenasDigitos(numero);
  if (!d) return "";
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return d;
}

type DadosMensagem = {
  produto?: string | null;
  nome?: string | null;
  cidade?: string | null;
  mensagem?: string | null;
};

/**
 * Texto que ja vai preenchido quando o cliente e redirecionado depois de
 * enviar a encomenda. A ideia e o primo receber a conversa ja com contexto,
 * sem precisar perguntar "qual equipamento?".
 */
export function mensagemDeEncomenda({
  produto,
  nome,
  cidade,
  mensagem,
}: DadosMensagem): string {
  const partes = ["Ola! Tenho interesse em um equipamento."];

  if (produto) partes.push(`Equipamento: ${produto}`);
  if (nome) partes.push(`Meu nome: ${nome}`);
  if (cidade) partes.push(`Cidade: ${cidade}`);
  if (mensagem?.trim()) partes.push(`Observacao: ${mensagem.trim()}`);

  return partes.join("\n");
}

/** Mensagem do botao flutuante, que nao tem produto nenhum no contexto. */
export function mensagemGenerica(nomeNegocio: string): string {
  return `Ola! Vim pelo site da ${nomeNegocio} e gostaria de mais informacoes.`;
}
