"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/utils/supabase/server";
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

  const supabase = await criarClienteServidor();

  const { error } = await supabase.auth.signInWithPassword({
    email: analise.data.email,
    password: analise.data.senha,
  });

  if (error) {
    // Mensagem generica de proposito: dizer "este e-mail nao existe" entrega
    // a um atacante quais e-mails estao cadastrados.
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
