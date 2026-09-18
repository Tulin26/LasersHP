"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { converterPedidoEmCliente } from "@/lib/acoes/pedidos";
import { ESTADO_INICIAL } from "@/lib/acoes/tipos";

/**
 * Transforma o lead do site em cliente do cadastro e ja abre a tela de venda.
 *
 * Esse e o caminho que liga as duas partes do sistema: o pedido nasce na
 * vitrine (pessoa anonima) e vira uma venda com cliente, vendedor e baixa de
 * estoque. Depois de converter, mandamos direto para /admin/vendas/nova com
 * o cliente e o pedido preenchidos, para o primo nao ter que procurar nada.
 */
export function ConverterPedido({
  pedidoId,
  produtoId,
  jaConvertido,
  clienteId,
}: {
  pedidoId: string;
  produtoId?: string | null;
  jaConvertido: boolean;
  clienteId?: string | null;
}) {
  const [estado, acao, enviando] = useActionState(
    converterPedidoEmCliente,
    ESTADO_INICIAL,
  );
  const router = useRouter();

  useEffect(() => {
    if (!estado.ok || !estado.id) return;

    toast.success(estado.mensagem ?? "Cliente criado.");

    const parametros = new URLSearchParams({
      cliente: estado.id,
      pedido: pedidoId,
    });
    if (produtoId) parametros.set("produto", produtoId);

    router.push(`/admin/vendas/nova?${parametros}`);
  }, [estado, pedidoId, produtoId, router]);

  useEffect(() => {
    if (!estado.ok && estado.mensagem) toast.error(estado.mensagem);
  }, [estado]);

  // Ja tem cliente ligado: pula a conversao e vai direto para a venda.
  if (jaConvertido && clienteId) {
    const parametros = new URLSearchParams({
      cliente: clienteId,
      pedido: pedidoId,
    });
    if (produtoId) parametros.set("produto", produtoId);

    return (
      <Button
        onClick={() => router.push(`/admin/vendas/nova?${parametros}`)}
        className="w-full"
      >
        Registrar venda deste pedido
      </Button>
    );
  }

  return (
    <form action={acao}>
      <input type="hidden" name="id" value={pedidoId} />
      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Convertendo...
          </>
        ) : (
          <>
            <UserPlus className="size-4" aria-hidden="true" />
            Converter em cliente e vender
          </>
        )}
      </Button>
    </form>
  );
}
