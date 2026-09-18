import Link from "next/link";
import {
  Boxes,
  Inbox,
  Receipt,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avisos,
  CabecalhoPagina,
  CartaoIndicador,
  Vazio,
} from "@/components/painel/ui-painel";
import { exigirSessao, montarDashboard } from "@/lib/consultas/painel";
import { formatarMoeda } from "@/lib/formatar";

/**
 * Dashboard.
 *
 * Todos os numeros sao do mes corrente e ja vem filtrados pelo RLS: se um
 * vendedor abrir esta tela, "total vendido" e o total DELE, porque o Postgres
 * simplesmente nao devolve as vendas dos outros. Nao existe um `if` no codigo
 * decidindo isso — e a regra que mora no banco.
 */
export default async function PaginaPainel(props: PageProps<"/admin">) {
  const searchParams = await props.searchParams;
  const sessao = await exigirSessao();
  const resumo = await montarDashboard();

  const mes = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const semPerfil = !sessao.perfil;

  return (
    <>
      <CabecalhoPagina
        titulo="Painel"
        descricao={`Resumo de ${mes}.`}
      >
        <Button render={<Link href="/admin/vendas/nova" />} size="sm">
          <Receipt className="size-4" aria-hidden="true" />
          Nova venda
        </Button>
      </CabecalhoPagina>

      <Avisos
        ok={searchParams.ok}
        erro={
          searchParams.erro === "sem-permissao"
            ? "Essa area e so para administradores."
            : searchParams.erro
        }
      />

      {/*
        Sem linha na tabela perfis o RLS bloqueia tudo e as telas aparecem
        vazias sem explicacao. Este aviso evita o susto de achar que quebrou.
      */}
      {semPerfil && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Seu usuario ainda nao tem perfil.</p>
          <p className="mt-1">
            Rode o arquivo{" "}
            <code className="rounded bg-amber-100 px-1">
              supabase/migrations/0002_criar_admin.sql
            </code>{" "}
            no SQL Editor do Supabase, trocando o e-mail pelo seu. Ate la o
            banco vai bloquear a leitura de todas as tabelas.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoIndicador
          titulo="Vendido no mes"
          valor={formatarMoeda(resumo.totalMes)}
          detalhe={`${resumo.quantidadeMes} ${
            resumo.quantidadeMes === 1 ? "venda" : "vendas"
          }`}
          icone={TrendingUp}
        />
        <CartaoIndicador
          titulo="Ticket medio"
          valor={formatarMoeda(resumo.ticketMedio)}
          detalhe="Media por venda no mes"
          icone={Receipt}
        />
        <CartaoIndicador
          titulo="Pedidos novos"
          valor={String(resumo.pedidosNovos)}
          detalhe="Vindos do site, sem atendimento"
          icone={Inbox}
          destaque={resumo.pedidosNovos > 0}
        />
        <CartaoIndicador
          titulo="Estoque baixo"
          valor={String(resumo.estoqueBaixo.length)}
          detalhe="Itens no minimo ou abaixo"
          icone={TriangleAlert}
          destaque={resumo.estoqueBaixo.length > 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ----------------------------------------------------------- */}
        <section className="bg-card rounded-xl border p-4">
          <h2 className="font-semibold">Vendas por vendedor</h2>

          {resumo.porVendedor.length === 0 ? (
            <p className="text-muted-foreground mt-3 text-sm">
              Nenhuma venda registrada neste mes.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {resumo.porVendedor.map((v) => {
                const percentual =
                  resumo.totalMes > 0 ? (v.total / resumo.totalMes) * 100 : 0;

                return (
                  <li key={v.nome}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{v.nome}</span>
                      <span className="shrink-0">
                        {formatarMoeda(v.total)}
                        <span className="text-muted-foreground ml-1 text-xs">
                          ({v.quantidade})
                        </span>
                      </span>
                    </div>
                    {/* Barra simples em CSS: nao vale carregar uma biblioteca
                        de graficos inteira por causa disto. */}
                    <div className="bg-muted mt-1.5 h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ----------------------------------------------------------- */}
        <section className="bg-card rounded-xl border p-4">
          <h2 className="font-semibold">Mais vendidos no mes</h2>

          {resumo.maisVendidos.length === 0 ? (
            <p className="text-muted-foreground mt-3 text-sm">
              Nenhum equipamento vendido neste mes.
            </p>
          ) : (
            <ol className="mt-4 space-y-2">
              {resumo.maisVendidos.map((p, i) => (
                <li
                  key={p.nome}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded text-xs font-medium">
                      {i + 1}
                    </span>
                    <span className="truncate">{p.nome}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="font-medium">{p.quantidade}</span>
                    <span className="text-muted-foreground ml-1 text-xs">
                      un · {formatarMoeda(p.total)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* ------------------------------------------------------------- */}
      <section className="bg-card rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Estoque baixo</h2>
          {sessao.ehAdmin && (
            <Button
              render={<Link href="/admin/produtos" />}
              variant="ghost"
              size="sm"
            >
              <Boxes className="size-4" aria-hidden="true" />
              Gerenciar
            </Button>
          )}
        </div>

        {resumo.estoqueBaixo.length === 0 ? (
          <p className="text-muted-foreground mt-3 text-sm">
            Nenhum equipamento no limite. Estoque tranquilo.
          </p>
        ) : (
          <ul className="mt-3 divide-y">
            {resumo.estoqueBaixo.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.nome}</span>
                  {p.modelo && (
                    <span className="text-muted-foreground text-xs">
                      {p.modelo}
                    </span>
                  )}
                </span>
                <span
                  className={
                    p.estoque === 0
                      ? "text-destructive shrink-0 font-semibold"
                      : "shrink-0 font-medium text-amber-600"
                  }
                >
                  {p.estoque} em estoque
                  <span className="text-muted-foreground ml-1 text-xs font-normal">
                    (min. {p.estoque_minimo})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {resumo.quantidadeMes === 0 && resumo.pedidosNovos === 0 && (
        <Vazio
          titulo="Tudo pronto para comecar"
          descricao="Cadastre os equipamentos, publique o site e os pedidos comecam a cair aqui."
          acao={
            sessao.ehAdmin
              ? { href: "/admin/produtos/novo", texto: "Cadastrar o primeiro equipamento" }
              : undefined
          }
        />
      )}
    </>
  );
}
