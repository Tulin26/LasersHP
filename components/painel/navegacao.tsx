"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Inbox,
  LayoutDashboard,
  Receipt,
  Settings,
  UserCog,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Menu do painel.
 *
 * Client Component por um motivo unico: `usePathname()` para destacar o item
 * aberto. Todo o resto do painel continua sendo Server Component.
 *
 * No celular vira uma barra horizontal rolavel no topo; no computador, uma
 * coluna fixa a esquerda. Sem drawer e sem estado — menos coisa para quebrar
 * numa tela que o primo vai usar correndo, entre um atendimento e outro.
 */

const ITENS = [
  { href: "/admin", rotulo: "Painel", icone: LayoutDashboard, exato: true },
  { href: "/admin/pedidos", rotulo: "Pedidos", icone: Inbox },
  { href: "/admin/vendas", rotulo: "Vendas", icone: Receipt },
  { href: "/admin/produtos", rotulo: "Equipamentos", icone: Boxes, soAdmin: true },
  { href: "/admin/clientes", rotulo: "Clientes", icone: Users },
  { href: "/admin/vendedores", rotulo: "Vendedores", icone: UserCog, soAdmin: true },
  { href: "/admin/configuracoes", rotulo: "Configuracoes", icone: Settings, soAdmin: true },
];

export function Navegacao({
  ehAdmin,
  pedidosNovos = 0,
}: {
  ehAdmin: boolean;
  pedidosNovos?: number;
}) {
  const caminho = usePathname();

  // O vendedor nao ve os itens que o RLS bloquearia de qualquer jeito —
  // melhor esconder do que deixar ele clicar e tomar "sem permissao".
  const itens = ITENS.filter((i) => ehAdmin || !i.soAdmin);

  return (
    <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible md:p-3">
      {itens.map(({ href, rotulo, icone: Icone, exato }) => {
        const ativo = exato ? caminho === href : caminho.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
              ativo
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icone className="size-4" aria-hidden="true" />
            <span>{rotulo}</span>

            {href === "/admin/pedidos" && pedidosNovos > 0 && (
              <span
                className={cn(
                  "ml-auto rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  ativo
                    ? "bg-primary-foreground text-primary"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {pedidosNovos}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
