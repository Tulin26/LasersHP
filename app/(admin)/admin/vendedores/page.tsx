import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avisos, CabecalhoPagina, Vazio } from "@/components/painel/ui-painel";
import { FormularioVendedor } from "@/components/painel/formulario-cliente";
import { BotaoExcluir } from "@/components/painel/botao-excluir";
import { exigirAdmin, listarVendedores } from "@/lib/consultas/painel";
import { excluirVendedor } from "@/lib/acoes/clientes";
import { formatarTelefone } from "@/lib/formatar";

export default async function PaginaVendedores(
  props: PageProps<"/admin/vendedores">,
) {
  await exigirAdmin();

  const searchParams = await props.searchParams;
  const vendedores = await listarVendedores();

  return (
    <>
      <CabecalhoPagina
        titulo="Vendedores"
        descricao="Toda venda fica ligada a um vendedor."
      />

      <Avisos ok={searchParams.ok} erro={searchParams.erro} />

      {/*
        Como dar acesso ao painel: o login em si e criado no Supabase, nao
        aqui. Criar contas pela aplicacao exigiria uma rota usando a chave
        secreta para mexer em usuarios — risco que nao compensa para um time
        de duas ou tres pessoas.
      */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Para dar acesso ao painel a um vendedor:</p>
        <ol className="mt-1 list-inside list-decimal space-y-0.5">
          <li>
            No Supabase, va em{" "}
            <strong>Authentication &gt; Users &gt; Add user</strong> e crie o
            e-mail e a senha (marque <em>Auto Confirm User</em>).
          </li>
          <li>
            Rode o bloco 2 de{" "}
            <code className="rounded bg-blue-100 px-1">
              supabase/migrations/0002_criar_admin.sql
            </code>{" "}
            trocando o e-mail e o nome.
          </li>
        </ol>
        <p className="mt-1">
          Sem esse passo o vendedor existe para registrar vendas, mas nao
          consegue entrar no sistema.
        </p>
      </div>

      <details className="bg-card group rounded-xl border">
        <summary className="flex cursor-pointer items-center gap-2 p-4 font-medium select-none">
          <Plus
            className="size-4 transition group-open:rotate-45"
            aria-hidden="true"
          />
          Cadastrar novo vendedor
        </summary>
        <div className="border-t p-4">
          <FormularioVendedor />
        </div>
      </details>

      {vendedores.length === 0 ? (
        <Vazio
          titulo="Nenhum vendedor cadastrado."
          descricao="Cadastre pelo menos um: sem vendedor nao da para registrar venda."
        />
      ) : (
        <div className="space-y-3">
          {vendedores.map((v) => (
            <details key={v.id} className="bg-card rounded-xl border">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4 select-none">
                <span className="min-w-0">
                  <span className="font-medium">{v.nome}</span>
                  <span className="text-muted-foreground block text-xs">
                    {[v.telefone ? formatarTelefone(v.telefone) : null, v.email]
                      .filter(Boolean)
                      .join(" · ") || "Sem contato cadastrado"}
                  </span>
                </span>

                <span className="flex items-center gap-2">
                  {v.usuario_id && <Badge variant="secondary">Tem login</Badge>}
                  <Badge variant={v.ativo ? "default" : "outline"}>
                    {v.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </span>
              </summary>

              <div className="space-y-4 border-t p-4">
                <FormularioVendedor vendedor={v} />

                <div className="border-t pt-4">
                  <BotaoExcluir
                    acao={excluirVendedor}
                    id={v.id}
                    rotulo="Excluir vendedor"
                    pergunta={`Excluir "${v.nome}"? Se ele ja tem vendas no historico, o banco vai recusar — nesse caso desmarque "ativo".`}
                    variante="outline"
                  />
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </>
  );
}
