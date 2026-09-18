"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Botao de excluir com confirmacao.
 *
 * O <form> chama uma Server Action normal; o unico motivo de este componente
 * ser "use client" e o confirm() do navegador. Se o usuario cancelar,
 * `event.preventDefault()` impede o envio.
 *
 * Optei pelo confirm nativo em vez de um modal bonito porque exclusao e uma
 * acao rara e irreversivel: o dialogo do sistema tira o usuario do piloto
 * automatico, que e exatamente o que se quer aqui.
 */
export function BotaoExcluir({
  acao,
  id,
  rotulo = "Excluir",
  pergunta = "Tem certeza que quer excluir? Esta acao nao pode ser desfeita.",
  variante = "destructive",
}: {
  acao: (formData: FormData) => Promise<void>;
  id: string;
  rotulo?: string;
  pergunta?: string;
  variante?: "destructive" | "outline" | "ghost";
}) {
  return (
    <form
      action={acao}
      onSubmit={(evento) => {
        if (!window.confirm(pergunta)) evento.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant={variante} size="sm">
        <Trash2 className="size-4" aria-hidden="true" />
        {rotulo}
      </Button>
    </form>
  );
}
