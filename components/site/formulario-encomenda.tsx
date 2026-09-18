"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { criarPedido } from "@/lib/acoes/pedidos";
import { ESTADO_INICIAL } from "@/lib/acoes/tipos";
import { mensagemDeEncomenda, montarLinkWhatsApp } from "@/lib/whatsapp";

/**
 * Formulario de encomenda.
 *
 * Este e um dos poucos Client Components do projeto ("use client" na primeira
 * linha). Precisa ser, por dois motivos: mostrar o estado de enviando e, no
 * sucesso, redirecionar o visitante para o WhatsApp — coisas que so acontecem
 * no navegador.
 *
 * Mesmo sendo Client Component, ele NAO fala com o banco. Ele chama a Server
 * Action `criarPedido`, que roda no servidor. O navegador so recebe o
 * resultado; a chave secreta e as regras continuam do outro lado.
 *
 * useActionState devolve tres coisas:
 *   estado    -> o que a action retornou (ok, mensagem, erros por campo)
 *   acao      -> o que vai no action={} do <form>
 *   enviando  -> true enquanto a requisicao esta em andamento
 */
export function FormularioEncomenda({
  produtoId,
  produtoNome,
  whatsapp,
}: {
  produtoId?: string;
  produtoNome?: string;
  whatsapp: string;
}) {
  const [estado, acao, enviando] = useActionState(criarPedido, ESTADO_INICIAL);

  /*
   * Guardamos o que o visitante digitou para montar a mensagem do WhatsApp.
   * Poderia ser um `ref`, mas ler ref durante a renderizacao e proibido no
   * React: o valor pode estar defasado em relacao ao que esta na tela. Com
   * estado, a mensagem sempre reflete o que foi digitado.
   */
  const [dados, setDados] = useState({ nome: "", cidade: "", mensagem: "" });

  const linkWhatsApp = useMemo(
    () =>
      montarLinkWhatsApp(
        whatsapp,
        mensagemDeEncomenda({
          produto: produtoNome,
          nome: dados.nome,
          cidade: dados.cidade,
          mensagem: dados.mensagem,
        }),
      ),
    [whatsapp, produtoNome, dados],
  );

  /*
   * "Enviado" e derivado de estado.ok, nao guardado numa variavel a parte.
   * Regra pratica do React: se um valor pode ser calculado a partir de outro,
   * nao crie estado para ele — senao os dois podem discordar entre si.
   */
  const enviado = estado.ok;

  useEffect(() => {
    if (!enviado || !whatsapp) return;

    /*
     * O pedido JA foi gravado no banco neste ponto — o painel enxerga o lead
     * mesmo que a pessoa feche a aba antes de abrir o WhatsApp. Por isso o
     * redirecionamento vem depois de salvar, e nao no lugar de salvar.
     *
     * Damos um respiro para a mensagem de sucesso aparecer na tela antes de
     * sair da pagina.
     */
    const id = setTimeout(() => {
      window.location.href = linkWhatsApp;
    }, 900);

    return () => clearTimeout(id);
  }, [enviado, whatsapp, linkWhatsApp]);

  if (enviado) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <MessageCircle
          className="mx-auto size-8 text-emerald-600"
          aria-hidden="true"
        />
        <h3 className="mt-3 font-semibold text-emerald-900">
          Pedido enviado com sucesso!
        </h3>
        <p className="mt-1 text-sm text-emerald-800">
          {whatsapp
            ? "Estamos abrindo o WhatsApp para voce finalizar a conversa..."
            : "Em breve entraremos em contato."}
        </p>

        {whatsapp && (
          <Button
            render={<a href={linkWhatsApp} />}
            variant="outline"
            className="mt-4"
          >
            Abrir o WhatsApp
          </Button>
        )}
      </div>
    );
  }

  return (
    <form
      action={acao}
      onChange={(evento) => {
        /*
         * Um unico onChange no <form> atende todos os campos (isso se chama
         * delegacao de evento). O TypeScript tipa `evento.target` como o
         * proprio <form>, mas em tempo de execucao ele e o campo que mudou —
         * por isso a conversao explicita aqui.
         */
        const alvo = evento.target as unknown as {
          name?: string;
          value?: string;
        };

        if (alvo.name && ["nome", "cidade", "mensagem"].includes(alvo.name)) {
          const campo = alvo.name;
          setDados((atual) => ({ ...atual, [campo]: alvo.value ?? "" }));
        }
      }}
      className="bg-card relative space-y-4 rounded-xl border p-5"
    >
      <div>
        <h3 className="font-semibold">Fazer encomenda</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Preencha os dados e continue a conversa no WhatsApp.
        </p>
      </div>

      {produtoId && <input type="hidden" name="produto_id" value={produtoId} />}

      {/*
        Honeypot: escondido para gente, visivel para robo que le o HTML.
        O conjunto (fora da tela + tabIndex -1 + autoComplete off) resolve sem
        atrapalhar leitor de tela, gracas ao aria-hidden.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="website">Nao preencha este campo</label>
        <input
          id="website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          nome="nome"
          rotulo="Seu nome"
          obrigatorio
          erro={estado.erros?.nome?.[0]}
        />
        <Campo
          nome="telefone"
          rotulo="Telefone / WhatsApp"
          tipo="tel"
          placeholder="(44) 99999-8888"
          obrigatorio
          erro={estado.erros?.telefone?.[0]}
        />
        <Campo
          nome="email"
          rotulo="E-mail"
          tipo="email"
          erro={estado.erros?.email?.[0]}
        />
        <Campo nome="cidade" rotulo="Cidade" erro={estado.erros?.cidade?.[0]} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mensagem">Mensagem</Label>
        <Textarea
          id="mensagem"
          name="mensagem"
          rows={3}
          placeholder="Conte o que voce precisa: tipo de atendimento, duvidas sobre o equipamento..."
        />
        {estado.erros?.mensagem?.[0] && (
          <p className="text-destructive text-xs">{estado.erros.mensagem[0]}</p>
        )}
      </div>

      {estado.mensagem && !estado.ok && (
        <p className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {estado.mensagem}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        {enviando ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Enviando...
          </>
        ) : (
          "Encomendar pelo WhatsApp"
        )}
      </Button>

      <p className="text-muted-foreground text-center text-xs">
        Seus dados sao usados apenas para este atendimento.
      </p>
    </form>
  );
}

/** Campo de texto com rotulo e mensagem de erro, para nao repetir markup. */
function Campo({
  nome,
  rotulo,
  tipo = "text",
  placeholder,
  obrigatorio,
  erro,
}: {
  nome: string;
  rotulo: string;
  tipo?: string;
  placeholder?: string;
  obrigatorio?: boolean;
  erro?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={nome}>
        {rotulo}
        {obrigatorio && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Input
        id={nome}
        name={nome}
        type={tipo}
        placeholder={placeholder}
        required={obrigatorio}
        aria-invalid={erro ? true : undefined}
      />
      {erro && <p className="text-destructive text-xs">{erro}</p>}
    </div>
  );
}
