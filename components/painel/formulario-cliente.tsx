"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampoArea, CampoMarcar, CampoTexto } from "@/components/painel/campos";
import { salvarCliente, salvarVendedor } from "@/lib/acoes/clientes";
import { ESTADO_INICIAL } from "@/lib/acoes/tipos";
import type { Cliente, Vendedor } from "@/lib/tipos/database.types";

/**
 * Formularios de cliente e de vendedor.
 *
 * Os dois moram no mesmo arquivo porque sao quase identicos e vivem lado a
 * lado no painel. Se um dia um deles crescer muito, separe — por enquanto,
 * juntar evita ficar pulando entre arquivos por causa de cinco campos.
 */

export function FormularioCliente({
  cliente,
  aoSalvar,
}: {
  cliente?: Cliente;
  /** Chamado depois de salvar. Usado para fechar o formulario da listagem. */
  aoSalvar?: () => void;
}) {
  const [estado, acao, enviando] = useActionState(
    salvarCliente,
    ESTADO_INICIAL,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!estado.ok) return;

    toast.success(estado.mensagem ?? "Salvo.");

    // Cadastro novo: limpa para o proximo. Edicao: mantem o que esta na tela.
    if (!cliente) formRef.current?.reset();

    aoSalvar?.();
    router.refresh();
  }, [estado, cliente, aoSalvar, router]);

  return (
    <form ref={formRef} action={acao} className="space-y-4">
      {cliente && <input type="hidden" name="id" value={cliente.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          nome="nome"
          rotulo="Nome"
          valor={cliente?.nome}
          obrigatorio
          erro={estado.erros?.nome?.[0]}
        />
        <CampoTexto
          nome="telefone"
          rotulo="Telefone / WhatsApp"
          tipo="tel"
          valor={cliente?.telefone}
          placeholder="(44) 99999-8888"
          erro={estado.erros?.telefone?.[0]}
        />
        <CampoTexto
          nome="email"
          rotulo="E-mail"
          tipo="email"
          valor={cliente?.email}
          erro={estado.erros?.email?.[0]}
        />
        <CampoTexto
          nome="documento"
          rotulo="CPF / CNPJ"
          valor={cliente?.documento}
          ajuda="Guardado so com numeros. Nao pode repetir."
          erro={estado.erros?.documento?.[0]}
        />
        <CampoTexto
          nome="cidade"
          rotulo="Cidade"
          valor={cliente?.cidade}
          erro={estado.erros?.cidade?.[0]}
          className="sm:col-span-2"
        />
      </div>

      <CampoArea
        nome="observacoes"
        rotulo="Observacoes"
        valor={cliente?.observacoes}
        linhas={3}
        erro={estado.erros?.observacoes?.[0]}
      />

      {estado.mensagem && !estado.ok && (
        <p className="text-destructive bg-destructive/10 rounded-lg p-3 text-sm">
          {estado.mensagem}
        </p>
      )}

      <Button type="submit" disabled={enviando}>
        {enviando ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Salvando...
          </>
        ) : cliente ? (
          "Salvar alteracoes"
        ) : (
          "Cadastrar cliente"
        )}
      </Button>
    </form>
  );
}

export function FormularioVendedor({ vendedor }: { vendedor?: Vendedor }) {
  const [estado, acao, enviando] = useActionState(
    salvarVendedor,
    ESTADO_INICIAL,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!estado.ok) return;
    toast.success(estado.mensagem ?? "Salvo.");
    if (!vendedor) formRef.current?.reset();
    router.refresh();
  }, [estado, vendedor, router]);

  return (
    <form ref={formRef} action={acao} className="space-y-4">
      {vendedor && <input type="hidden" name="id" value={vendedor.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          nome="nome"
          rotulo="Nome"
          valor={vendedor?.nome}
          obrigatorio
          erro={estado.erros?.nome?.[0]}
        />
        <CampoTexto
          nome="telefone"
          rotulo="Telefone"
          tipo="tel"
          valor={vendedor?.telefone}
          erro={estado.erros?.telefone?.[0]}
        />
        <CampoTexto
          nome="email"
          rotulo="E-mail"
          tipo="email"
          valor={vendedor?.email}
          ajuda="Se este vendedor for acessar o painel, use o mesmo e-mail do login."
          erro={estado.erros?.email?.[0]}
          className="sm:col-span-2"
        />
      </div>

      <CampoArea
        nome="observacoes"
        rotulo="Observacoes"
        valor={vendedor?.observacoes}
        linhas={2}
        erro={estado.erros?.observacoes?.[0]}
      />

      <CampoMarcar
        nome="ativo"
        rotulo="Ativo"
        ajuda="Vendedor inativo some das listas de nova venda, mas o historico dele continua."
        marcado={vendedor?.ativo ?? true}
      />

      {estado.mensagem && !estado.ok && (
        <p className="text-destructive bg-destructive/10 rounded-lg p-3 text-sm">
          {estado.mensagem}
        </p>
      )}

      <Button type="submit" disabled={enviando}>
        {enviando ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Salvando...
          </>
        ) : vendedor ? (
          "Salvar alteracoes"
        ) : (
          "Cadastrar vendedor"
        )}
      </Button>
    </form>
  );
}
