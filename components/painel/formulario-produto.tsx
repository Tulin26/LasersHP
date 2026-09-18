"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampoArea, CampoMarcar, CampoTexto } from "@/components/painel/campos";
import { UploadImagens } from "@/components/painel/upload-imagens";
import { salvarProduto } from "@/lib/acoes/produtos";
import { ESTADO_INICIAL } from "@/lib/acoes/tipos";
import type { Produto } from "@/lib/tipos/database.types";

/**
 * Formulario de cadastro/edicao de equipamento.
 *
 * O mesmo componente serve para criar e para editar: quando recebe `produto`,
 * manda o id junto e a Server Action faz UPDATE em vez de INSERT. Menos
 * codigo duplicado e, principalmente, uma regra de validacao so.
 */
export function FormularioProduto({ produto }: { produto?: Produto }) {
  const [estado, acao, enviando] = useActionState(
    salvarProduto,
    ESTADO_INICIAL,
  );
  const router = useRouter();

  // Controla se o campo de preco fica desabilitado.
  const [sobConsulta, setSobConsulta] = useState(
    produto?.preco_sob_consulta ?? false,
  );

  useEffect(() => {
    if (!estado.ok) return;

    toast.success(estado.mensagem ?? "Salvo.");

    // Depois de criar, vai para a edicao do registro novo; depois de editar,
    // volta para a listagem.
    if (produto) router.push("/admin/produtos");
    else if (estado.id) router.push(`/admin/produtos/${estado.id}`);
  }, [estado, produto, router]);

  return (
    <form action={acao} className="space-y-6">
      {produto && <input type="hidden" name="id" value={produto.id} />}

      <section className="bg-card space-y-4 rounded-xl border p-4">
        <h2 className="font-semibold">Identificacao</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto
            nome="nome"
            rotulo="Nome do equipamento"
            valor={produto?.nome}
            obrigatorio
            erro={estado.erros?.nome?.[0]}
          />
          <CampoTexto
            nome="modelo"
            rotulo="Modelo"
            valor={produto?.modelo}
            placeholder="Ex.: HP-808 Pro"
            erro={estado.erros?.modelo?.[0]}
          />
        </div>

        <CampoArea
          nome="descricao"
          rotulo="Descricao"
          valor={produto?.descricao}
          linhas={5}
          placeholder="Potencia, tecnologia, itens inclusos, garantia..."
          erro={estado.erros?.descricao?.[0]}
        />

        <CampoArea
          nome="indicacoes"
          rotulo="Indicacoes de uso"
          valor={produto?.indicacoes}
          linhas={4}
          ajuda="Uma indicacao por linha — a vitrine transforma cada linha num item da lista."
          placeholder={
            "Depilacao definitiva\nRejuvenescimento facial\nTratamento de manchas"
          }
          erro={estado.erros?.indicacoes?.[0]}
        />
      </section>

      <section className="bg-card space-y-4 rounded-xl border p-4">
        <h2 className="font-semibold">Preco e estoque</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <CampoTexto
            nome="preco"
            rotulo="Preco (R$)"
            tipo="number"
            passo="0.01"
            minimo={0}
            valor={produto?.preco ?? ""}
            erro={estado.erros?.preco?.[0]}
            className={sobConsulta ? "opacity-50" : undefined}
          />
          <CampoTexto
            nome="estoque"
            rotulo="Quantidade em estoque"
            tipo="number"
            minimo={0}
            valor={produto?.estoque ?? 0}
            erro={estado.erros?.estoque?.[0]}
          />
          <CampoTexto
            nome="estoque_minimo"
            rotulo="Estoque minimo"
            tipo="number"
            minimo={0}
            valor={produto?.estoque_minimo ?? 1}
            ajuda="Abaixo disso entra no alerta do painel."
            erro={estado.erros?.estoque_minimo?.[0]}
          />
        </div>

        <div>
          <label className="flex items-start gap-3 rounded-lg border p-3">
            <input
              name="preco_sob_consulta"
              type="checkbox"
              checked={sobConsulta}
              onChange={(e) => setSobConsulta(e.target.checked)}
              className="accent-primary mt-0.5 size-4"
            />
            <span className="grid gap-0.5 leading-tight">
              <span className="text-sm font-medium">
                Mostrar &quot;sob consulta&quot; no lugar do preco
              </span>
              <span className="text-muted-foreground text-xs">
                O equipamento continua na vitrine, mas o valor so e passado no
                atendimento.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="bg-card space-y-4 rounded-xl border p-4">
        <h2 className="font-semibold">Fotos</h2>
        <UploadImagens iniciais={produto?.imagens ?? []} />
      </section>

      <section className="bg-card space-y-3 rounded-xl border p-4">
        <h2 className="font-semibold">Publicacao</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <CampoMarcar
            nome="ativo"
            rotulo="Visivel na vitrine"
            ajuda="Desmarque para tirar do site sem excluir o cadastro."
            marcado={produto?.ativo ?? true}
          />
          <CampoMarcar
            nome="destaque"
            rotulo="Destacar na home"
            ajuda="Aparece na secao de destaques da pagina inicial."
            marcado={produto?.destaque ?? false}
          />
        </div>
      </section>

      {estado.mensagem && !estado.ok && (
        <p className="text-destructive bg-destructive/10 rounded-lg p-3 text-sm">
          {estado.mensagem}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={enviando}>
          {enviando ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Salvando...
            </>
          ) : produto ? (
            "Salvar alteracoes"
          ) : (
            "Cadastrar equipamento"
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/produtos")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
