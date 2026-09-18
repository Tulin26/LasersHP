"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CampoArea,
  CampoSelecao,
  CampoTexto,
} from "@/components/painel/campos";
import { registrarVenda } from "@/lib/acoes/vendas";
import { ESTADO_INICIAL } from "@/lib/acoes/tipos";
import { OPCOES_FORMA_PAGAMENTO, OPCOES_STATUS_VENDA } from "@/lib/constantes";
import { formatarMoeda, paraDataISO } from "@/lib/formatar";
import type { Cliente, Produto, Vendedor } from "@/lib/tipos/database.types";

type Linha = {
  /** chave local so para o React, nao vai para o banco */
  chave: string;
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
};

/**
 * Registro de venda com varios equipamentos.
 *
 * A parte interessante e como os itens chegam ao servidor: em vez de campos
 * soltos tipo `itens[0][produto_id]`, guardamos as linhas num estado do React
 * e mandamos tudo num unico campo escondido, em JSON. No servidor o Zod le
 * esse JSON e valida item por item.
 *
 * O total NAO e enviado. Ele e calculado aqui so para o primo conferir na
 * tela; quem faz a conta que vale e o Postgres, na coluna gerada
 * `total = subtotal - desconto`. Se o total viesse do formulario, daria para
 * forjar uma venda de R$ 1,00 mexendo no HTML.
 */
export function FormularioVenda({
  clientes,
  vendedores,
  produtos,
  clienteInicial,
  vendedorInicial,
  produtoInicial,
  pedidoId,
}: {
  clientes: Cliente[];
  vendedores: Vendedor[];
  produtos: Produto[];
  clienteInicial?: string;
  vendedorInicial?: string;
  produtoInicial?: string;
  pedidoId?: string;
}) {
  const [estado, acao, enviando] = useActionState(
    registrarVenda,
    ESTADO_INICIAL,
  );
  const router = useRouter();

  const [linhas, setLinhas] = useState<Linha[]>(() => {
    const produto = produtos.find((p) => p.id === produtoInicial);
    return [
      {
        chave: crypto.randomUUID(),
        produto_id: produto?.id ?? "",
        quantidade: 1,
        valor_unitario: Number(produto?.preco ?? 0),
      },
    ];
  });

  const [desconto, setDesconto] = useState(0);

  const subtotal = useMemo(
    () =>
      linhas.reduce(
        (soma, l) => soma + (l.quantidade || 0) * (l.valor_unitario || 0),
        0,
      ),
    [linhas],
  );

  const total = Math.max(subtotal - desconto, 0);

  useEffect(() => {
    if (estado.ok && estado.id) {
      toast.success(estado.mensagem ?? "Venda registrada.");
      router.push(`/admin/vendas/${estado.id}`);
    } else if (!estado.ok && estado.mensagem) {
      toast.error(estado.mensagem);
    }
  }, [estado, router]);

  function adicionarLinha() {
    setLinhas((atual) => [
      ...atual,
      {
        chave: crypto.randomUUID(),
        produto_id: "",
        quantidade: 1,
        valor_unitario: 0,
      },
    ]);
  }

  function removerLinha(chave: string) {
    setLinhas((atual) =>
      atual.length === 1 ? atual : atual.filter((l) => l.chave !== chave),
    );
  }

  function atualizarLinha(chave: string, mudanca: Partial<Linha>) {
    setLinhas((atual) =>
      atual.map((l) => (l.chave === chave ? { ...l, ...mudanca } : l)),
    );
  }

  /** Ao escolher o equipamento, ja sugere o preco de tabela. */
  function escolherProduto(chave: string, produtoId: string) {
    const produto = produtos.find((p) => p.id === produtoId);
    atualizarLinha(chave, {
      produto_id: produtoId,
      valor_unitario: Number(produto?.preco ?? 0),
    });
  }

  const opcoesProduto = produtos.map((p) => ({
    valor: p.id,
    texto: `${p.nome}${p.modelo ? ` — ${p.modelo}` : ""} (${p.estoque} em estoque)`,
  }));

  return (
    <form action={acao} className="space-y-6">
      {/* Itens no formato que a funcao registrar_venda espera. */}
      <input
        type="hidden"
        name="itens"
        value={JSON.stringify(
          linhas
            .filter((l) => l.produto_id)
            .map(({ produto_id, quantidade, valor_unitario }) => ({
              produto_id,
              quantidade,
              valor_unitario,
            })),
        )}
      />
      {pedidoId && <input type="hidden" name="pedido_id" value={pedidoId} />}

      {/* ------------------------------------------------------------- */}
      <section className="bg-card space-y-4 rounded-xl border p-4">
        <h2 className="font-semibold">Dados da venda</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CampoTexto
            nome="data"
            rotulo="Data"
            tipo="date"
            valor={paraDataISO(new Date())}
            obrigatorio
            erro={estado.erros?.data?.[0]}
          />

          <CampoSelecao
            nome="cliente_id"
            rotulo="Cliente"
            opcoes={clientes.map((c) => ({ valor: c.id, texto: c.nome }))}
            valor={clienteInicial}
            vazio="Selecione o cliente"
            obrigatorio
            erro={estado.erros?.cliente_id?.[0]}
          />

          <CampoSelecao
            nome="vendedor_id"
            rotulo="Vendedor"
            opcoes={vendedores.map((v) => ({ valor: v.id, texto: v.nome }))}
            valor={vendedorInicial}
            vazio="Selecione o vendedor"
            obrigatorio
            erro={estado.erros?.vendedor_id?.[0]}
          />

          <CampoSelecao
            nome="forma_pagamento"
            rotulo="Forma de pagamento"
            opcoes={OPCOES_FORMA_PAGAMENTO.map((o) => ({
              valor: o.valor,
              texto: o.texto,
            }))}
            valor="pix"
            erro={estado.erros?.forma_pagamento?.[0]}
          />
        </div>

        {clientes.length === 0 && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            Nenhum cliente cadastrado. Cadastre um em Clientes antes de
            registrar a venda.
          </p>
        )}

        {vendedores.length === 0 && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            Nenhum vendedor ativo. Cadastre um em Vendedores antes de registrar
            a venda.
          </p>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      <section className="bg-card space-y-4 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Equipamentos</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adicionarLinha}
          >
            <Plus className="size-4" aria-hidden="true" />
            Adicionar item
          </Button>
        </div>

        <ul className="space-y-3">
          {linhas.map((linha) => {
            const produto = produtos.find((p) => p.id === linha.produto_id);
            const semEstoque =
              produto !== undefined && linha.quantidade > produto.estoque;

            return (
              <li
                key={linha.chave}
                className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_100px_140px_auto] sm:items-end"
              >
                <div className="space-y-1.5">
                  <Label htmlFor={`produto-${linha.chave}`}>Equipamento</Label>
                  <select
                    id={`produto-${linha.chave}`}
                    value={linha.produto_id}
                    onChange={(e) =>
                      escolherProduto(linha.chave, e.target.value)
                    }
                    className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-3 text-sm shadow-xs outline-none focus-visible:ring-3"
                  >
                    <option value="">Selecione...</option>
                    {opcoesProduto.map((o) => (
                      <option key={o.valor} value={o.valor}>
                        {o.texto}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`qtd-${linha.chave}`}>Qtd.</Label>
                  <Input
                    id={`qtd-${linha.chave}`}
                    type="number"
                    min={1}
                    value={linha.quantidade}
                    onChange={(e) =>
                      atualizarLinha(linha.chave, {
                        quantidade: Number(e.target.value),
                      })
                    }
                    aria-invalid={semEstoque || undefined}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`valor-${linha.chave}`}>Valor unitario</Label>
                  <Input
                    id={`valor-${linha.chave}`}
                    type="number"
                    step="0.01"
                    min={0}
                    value={linha.valor_unitario}
                    onChange={(e) =>
                      atualizarLinha(linha.chave, {
                        valor_unitario: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="flex items-center gap-2 sm:pb-1">
                  <span className="text-sm font-medium sm:hidden">
                    {formatarMoeda(linha.quantidade * linha.valor_unitario)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removerLinha(linha.chave)}
                    disabled={linhas.length === 1}
                    aria-label="Remover item"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>

                {semEstoque && (
                  <p className="text-destructive text-xs sm:col-span-4">
                    Estoque disponivel: {produto?.estoque}. O banco vai recusar
                    a venda se a quantidade passar disso.
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        {estado.erros?.itens?.[0] && (
          <p className="text-destructive text-sm">{estado.erros.itens[0]}</p>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      <section className="bg-card space-y-4 rounded-xl border p-4">
        <h2 className="font-semibold">Fechamento</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="desconto">Desconto (R$)</Label>
            <Input
              id="desconto"
              name="desconto"
              type="number"
              step="0.01"
              min={0}
              value={desconto}
              onChange={(e) => setDesconto(Number(e.target.value) || 0)}
              aria-invalid={desconto > subtotal || undefined}
            />
            {desconto > subtotal && (
              <p className="text-destructive text-xs">
                O desconto nao pode passar do subtotal.
              </p>
            )}
          </div>

          <CampoSelecao
            nome="status"
            rotulo="Situacao do pagamento"
            opcoes={OPCOES_STATUS_VENDA.filter(
              (o) => o.valor !== "cancelado",
            ).map((o) => ({ valor: o.valor, texto: o.texto }))}
            valor="pendente"
            erro={estado.erros?.status?.[0]}
          />
        </div>

        <CampoArea
          nome="observacoes"
          rotulo="Observacoes"
          linhas={2}
          placeholder="Condicoes combinadas, prazo de entrega, numero da nota..."
        />

        <Separator />

        <dl className="ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatarMoeda(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Desconto</dt>
            <dd>- {formatarMoeda(desconto)}</dd>
          </div>
          <div className="flex justify-between border-t pt-1 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatarMoeda(total)}</dd>
          </div>
        </dl>
      </section>

      {estado.mensagem && !estado.ok && (
        <p className="text-destructive bg-destructive/10 rounded-lg p-3 text-sm">
          {estado.mensagem}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={
            enviando || clientes.length === 0 || vendedores.length === 0
          }
        >
          {enviando ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Registrando...
            </>
          ) : (
            "Registrar venda"
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/vendas")}
        >
          Cancelar
        </Button>
      </div>

      <p className="text-muted-foreground text-xs">
        Ao salvar, o estoque de cada equipamento e baixado na mesma transacao.
        Se faltar estoque de qualquer item, nada e gravado.
      </p>
    </form>
  );
}
