"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/utils/supabase/server";
import { criarClienteAdmin } from "@/utils/supabase/admin";
import { hashDeTexto, hashDoIP } from "@/lib/seguranca";
import { schemaLogin } from "@/lib/validacoes/autenticacao";
import { falha, type EstadoFormulario } from "@/lib/acoes/tipos";

/**
 * "use server" no topo do arquivo: TUDO aqui vira Server Action.
 *
 * Como funciona, comparando com o que voce ja conhece: em PHP o <form> aponta
 * para outro arquivo .php e voce le o $_POST. Aqui o <form action={entrar}>
 * aponta para a FUNCAO. O Next cria o endpoint sozinho, serializa os dados e
 * chama a funcao no servidor. O corpo desta funcao nunca e enviado ao
 * navegador — por isso da para mexer em cookie e chave secreta aqui dentro.
 *
 * A assinatura (estadoAnterior, formData) e o que o `useActionState` espera.
 */
export async function entrar(
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const bruto = {
    email: String(formData.get("email") ?? ""),
    senha: String(formData.get("senha") ?? ""),
    redirecionar: String(formData.get("redirecionar") ?? "/admin"),
  };

  const analise = schemaLogin.safeParse(bruto);
  if (!analise.success) {
    return falha(
      "Confira os campos destacados.",
      analise.error.flatten().fieldErrors,
    );
  }

  /*
   * FREIO DE FORCA BRUTA
   *
   * Por que foi preciso escrever isto: testando o endpoint de login do
   * Supabase direto, ele aceitou 12 senhas erradas seguidas sem reclamar.
   * Sem freio, um script testa milhares de senhas por hora.
   *
   * O freio mora no banco (funcao pode_tentar_login) e nao em memoria porque
   * na Vercel cada requisicao pode cair numa instancia diferente: um contador
   * em variavel seria zerado o tempo todo e nao valeria de nada.
   *
   * Usa o cliente com a chave secreta porque a tabela tentativas_login tem
   * RLS ligado e NENHUMA policy — ninguem a alcanca pelo PostgREST.
   */
  const admin = criarClienteAdmin();
  const ipHash = await hashDoIP();
  const emailHash = hashDeTexto(analise.data.email);

  const { data: liberado } = await admin.rpc("pode_tentar_login", {
    p_ip_hash: ipHash,
    p_email_hash: emailHash,
  });

  if (liberado === false) {
    return falha(
      "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.",
    );
  }

  const supabase = await criarClienteServidor();

  const { error } = await supabase.auth.signInWithPassword({
    email: analise.data.email,
    password: analise.data.senha,
  });

  // Registra o resultado ANTES de qualquer saida: e o acerto que limpa as
  // falhas anteriores daquele par IP + e-mail.
  await admin.rpc("registrar_tentativa_login", {
    p_ip_hash: ipHash,
    p_email_hash: emailHash,
    p_sucesso: !error,
  });

  if (error) {
    // Mensagem generica de proposito: dizer "este e-mail nao existe" entrega
    // a um atacante quais e-mails estao cadastrados. Pelo mesmo motivo o
    // texto e identico quer a conta exista ou nao.
    return falha("E-mail ou senha incorretos.");
  }

  revalidatePath("/", "layout");

  // Só aceita caminho interno. Sem esta checagem, alguem poderia mandar o
  // link /login?redirecionar=https://site-falso.com e usar o seu login como
  // trampolim (isso se chama open redirect).
  const destino = analise.data.redirecionar ?? "/admin";
  const seguro =
    destino.startsWith("/") && !destino.startsWith("//") ? destino : "/admin";

  // redirect() funciona lancando uma excecao especial — por isso fica fora
  // de qualquer try/catch e nada depois dele executa.
  redirect(seguro);
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
