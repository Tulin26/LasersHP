"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ajustarEstoque } from "@/lib/acoes/produtos";
import { ESTADO_INICIAL } from "@/lib/acoes/tipos";

/**
 * Entrada e baixa manual de estoque.
 *
 * O campo `delta` e a VARIACAO, nao o valor final: +3 quando chegou
 * mercadoria, -1 quando um aparelho saiu por outro motivo. Por que assim?
 * Porque digitar o valor final abriria espaco para o classico problema de
 * concorrencia: duas pessoas leem "5", uma grava 8 e a outra grava 4, e o
 * trabalho de uma some. Somando/subtraindo, o proprio Postgres resolve.
 */
export function AjusteEstoque({
  produtoId,
  estoqueAtual,
}: {
  produtoId: string;
  estoqueAtual: number;
}) {
  const [estado, acao, enviando] = useActionState(
    ajustarEstoque,
    ESTADO_INICIAL,
  );

  useEffect(() => {
    if (estado.ok && estado.mensagem) toast.success(estado.mensagem);
    if (!estado.ok && estado.mensagem) toast.error(estado.mensagem);
  }, [estado]);

  return (
    <form action={acao} className="space-y-3">
      <input type="hidden" name="id" value={produtoId} />

      <div>
        <p className="text-muted-foreground text-sm">Estoque atual</p>
        <p className="text-2xl font-semibold">{estoqueAtual}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="delta">Movimentar</Label>
        <div className="flex gap-2">
          <Input
            id="delta"
            name="delta"
            type="number"
            step="1"
            defaultValue={1}
            className="w-24"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={enviando}
            title="Somar a quantidade informada"
          >
            <Plus className="size-4" aria-hidden="true" />
            Entrada
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Use numero negativo (ex.: -2) para dar baixa.
        </p>
      </div>

      <p className="text-muted-foreground flex items-center gap-1 text-xs">
        <Minus className="size-3" aria-hidden="true" />
        Venda registrada no sistema ja baixa o estoque sozinha.
      </p>
    </form>
  );
}
