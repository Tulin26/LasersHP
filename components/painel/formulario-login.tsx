"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { entrar } from "@/lib/acoes/autenticacao";
import { ESTADO_INICIAL } from "@/lib/acoes/tipos";

export function FormularioLogin({ redirecionar }: { redirecionar: string }) {
  const [estado, acao, enviando] = useActionState(entrar, ESTADO_INICIAL);

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
        <Input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={estado.erros?.senha ? true : undefined}
        />
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
