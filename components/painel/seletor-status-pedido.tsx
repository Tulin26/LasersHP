"use client";

import { useRef } from "react";
import { atualizarStatusPedido } from "@/lib/acoes/pedidos";
import { OPCOES_STATUS_PEDIDO } from "@/lib/constantes";
import type { StatusPedido } from "@/lib/tipos/database.types";

/**
 * Troca o status do pedido direto na listagem.
 *
 * O truque: o <select> esta dentro de um <form> com Server Action, e o
 * onChange manda o proprio formulario. Assim nao existe botao "salvar" —
 * escolher ja grava.
 *
 * `requestSubmit()` e nao `submit()`: o primeiro respeita o React e dispara
 * o mesmo caminho de um envio normal; o segundo pula o tratamento do
 * framework e o formulario nao chegaria na Server Action.
 */
export function SeletorStatusPedido({
  id,
  status,
}: {
  id: string;
  status: StatusPedido;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={atualizarStatusPedido}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={() => formRef.current?.requestSubmit()}
        aria-label="Situacao do pedido"
        className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2 text-sm shadow-xs outline-none focus-visible:ring-3"
      >
        {OPCOES_STATUS_PEDIDO.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </form>
  );
}
