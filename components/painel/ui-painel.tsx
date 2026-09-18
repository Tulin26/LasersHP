import Link from "next/link";
import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { STATUS_PEDIDO, STATUS_VENDA } from "@/lib/constantes";
import type { StatusPedido, StatusVenda } from "@/lib/tipos/database.types";

/** Peças visuais repetidas em quase toda tela do painel. */

export function CabecalhoPagina({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  /** Botoes de acao do canto direito. */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descricao && (
          <p className="text-muted-foreground mt-1 text-sm">{descricao}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

/**
 * Avisos de sucesso e erro.
 *
 * As acoes que terminam em redirect() nao conseguem devolver um objeto de
 * estado, entao mandam o recado pela URL (?ok=... / ?erro=...) e esta caixa
 * mostra. E o mesmo padrao de "flash message" de PHP, so que sem sessao.
 */
export function Avisos({
  ok,
  erro,
}: {
  ok?: string | string[];
  erro?: string | string[];
}) {
  const textoOk = Array.isArray(ok) ? ok[0] : ok;
  const textoErro = Array.isArray(erro) ? erro[0] : erro;

  if (!textoOk && !textoErro) return null;

  return (
    <div className="space-y-2">
      {textoOk && (
        <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {textoOk}
        </p>
      )}
      {textoErro && (
        <p className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {textoErro}
        </p>
      )}
    </div>
  );
}

/** Estado vazio: some da tela quando houver dados. */
export function Vazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: { href: string; texto: string };
}) {
  return (
    <div className="bg-muted/30 rounded-xl border border-dashed p-10 text-center">
      <p className="font-medium">{titulo}</p>
      {descricao && (
        <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
          {descricao}
        </p>
      )}
      {acao && (
        <Link
          href={acao.href}
          className="text-primary mt-3 inline-block text-sm font-medium hover:underline"
        >
          {acao.texto}
        </Link>
      )}
    </div>
  );
}

export function EtiquetaStatusPedido({ status }: { status: StatusPedido }) {
  const { texto, classe } = STATUS_PEDIDO[status];
  return (
    <Badge variant="outline" className={cn("font-medium", classe)}>
      {texto}
    </Badge>
  );
}

export function EtiquetaStatusVenda({ status }: { status: StatusVenda }) {
  const { texto, classe } = STATUS_VENDA[status];
  return (
    <Badge variant="outline" className={cn("font-medium", classe)}>
      {texto}
    </Badge>
  );
}

/** Cartao de numero do dashboard. */
export function CartaoIndicador({
  titulo,
  valor,
  detalhe,
  icone: Icone,
  destaque,
}: {
  titulo: string;
  valor: string;
  detalhe?: string;
  icone: React.ComponentType<{ className?: string }>;
  destaque?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border p-4",
        destaque && "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{titulo}</p>
        <Icone className="text-muted-foreground size-4" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{valor}</p>
      {detalhe && (
        <p className="text-muted-foreground mt-1 text-xs">{detalhe}</p>
      )}
    </div>
  );
}
