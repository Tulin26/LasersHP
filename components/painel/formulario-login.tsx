"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { entrar } from "@/lib/acoes/autenticacao";
import { ESTADO_INICIAL } from "@/lib/acoes/tipos";

export function FormularioLogin({ redirecionar }: { redirecionar: string }) {
  const [estado, acao, enviando] = useActionState(entrar, ESTADO_INICIAL);

  /*
   * Mostrar ou esconder a senha.
   *
   * O campo comeca escondido, que e o certo: alguem pode estar olhando a
   * tela. Mas senha longa digitada as cegas e a receita para errar e nao
   * saber onde — e o sistema, de proposito, nao diz se o erro foi no e-mail
   * ou na senha. Poder conferir antes de enviar resolve isso.
   *
   * O estado vive aqui e nao no DOM porque o React precisa saber o valor
   * para trocar o icone junto com o tipo do campo.
   */
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  return (
    <form action={acao} className="space-y-4">
      {/*
        Para onde voltar depois de entrar. Quem tentou abrir /admin/vendas sem
        estar logado foi mandado para ca pelo proxy.ts, com o caminho original
        na URL — assim, depois do login, cai exatamente onde queria.
      */}
      <input type="hidden" name="redirecionar" value={redirecionar} />

      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          aria-invalid={estado.erros?.email ? true : undefined}
        />
        {estado.erros?.email?.[0] && (
          <p className="text-destructive text-xs">{estado.erros.email[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="senha">Senha</Label>

        <div className="relative">
          <Input
            id="senha"
            name="senha"
            type={senhaVisivel ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={estado.erros?.senha ? true : undefined}
            /* Espaco a direita para o botao nao cobrir o que foi digitado. */
            className="pr-10"
          />

          {/*
            type="button" e obrigatorio: dentro de um <form>, um <button> sem
            type vira "submit" e clicar no olhinho enviaria o formulario.

            aria-label muda junto com o estado, senao quem usa leitor de tela
            ouve sempre "mostrar senha", inclusive quando ela ja esta visivel.
          */}
          <button
            type="button"
            onClick={() => setSenhaVisivel((v) => !v)}
            aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={senhaVisivel}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md transition focus-visible:ring-2 focus-visible:outline-none"
          >
            {senhaVisivel ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {estado.erros?.senha?.[0] && (
          <p className="text-destructive text-xs">{estado.erros.senha[0]}</p>
        )}
      </div>

      {estado.mensagem && !estado.ok && (
        <p className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {estado.mensagem}
        </p>
      )}

      <Button type="submit" className="h-10 w-full" disabled={enviando}>
        {enviando ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  );
}
