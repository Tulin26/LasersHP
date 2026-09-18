import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Campos de formulario do painel.
 *
 * Decisao consciente: aqui usamos <select> NATIVO em vez do <Select> do
 * shadcn. Motivos:
 *   - funciona sem JavaScript e entra no FormData sozinho;
 *   - no celular abre o seletor nativo do sistema, que e mais rapido de usar
 *     numa tela de cadastro;
 *   - o componente do shadcn precisaria de estado no cliente para cada campo.
 * Para um ERP, onde a tela e cheia de campos, isso e menos codigo e menos
 * coisa para quebrar.
 */

const classeControle =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 h-9 w-full rounded-lg border px-3 py-1 text-sm shadow-xs transition outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50";

type Comum = {
  nome: string;
  rotulo: string;
  ajuda?: string;
  erro?: string;
  obrigatorio?: boolean;
  className?: string;
};

function Envolucro({
  nome,
  rotulo,
  ajuda,
  erro,
  obrigatorio,
  className,
  children,
}: Comum & { children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={nome}>
        {rotulo}
        {obrigatorio && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {ajuda && !erro && (
        <p className="text-muted-foreground text-xs">{ajuda}</p>
      )}
      {erro && <p className="text-destructive text-xs">{erro}</p>}
    </div>
  );
}

export function CampoTexto({
  tipo = "text",
  valor,
  placeholder,
  passo,
  minimo,
  ...comum
}: Comum & {
  tipo?: string;
  valor?: string | number | null;
  placeholder?: string;
  passo?: string;
  minimo?: string | number;
}) {
  return (
    <Envolucro {...comum}>
      <Input
        id={comum.nome}
        name={comum.nome}
        type={tipo}
        step={passo}
        min={minimo}
        defaultValue={valor ?? ""}
        placeholder={placeholder}
        required={comum.obrigatorio}
        aria-invalid={comum.erro ? true : undefined}
      />
    </Envolucro>
  );
}

export function CampoArea({
  valor,
  placeholder,
  linhas = 4,
  ...comum
}: Comum & { valor?: string | null; placeholder?: string; linhas?: number }) {
  return (
    <Envolucro {...comum}>
      <Textarea
        id={comum.nome}
        name={comum.nome}
        rows={linhas}
        defaultValue={valor ?? ""}
        placeholder={placeholder}
        aria-invalid={comum.erro ? true : undefined}
      />
    </Envolucro>
  );
}

export type Opcao = { valor: string; texto: string };

export function CampoSelecao({
  opcoes,
  valor,
  vazio,
  ...comum
}: Comum & {
  opcoes: Opcao[];
  valor?: string | null;
  /** Texto da primeira opcao em branco (ex.: "Selecione..."). */
  vazio?: string;
}) {
  return (
    <Envolucro {...comum}>
      <select
        id={comum.nome}
        name={comum.nome}
        defaultValue={valor ?? ""}
        required={comum.obrigatorio}
        aria-invalid={comum.erro ? true : undefined}
        className={classeControle}
      >
        {vazio && <option value="">{vazio}</option>}
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </Envolucro>
  );
}

/** Caixa de marcar com rotulo ao lado e explicacao embaixo. */
export function CampoMarcar({
  nome,
  rotulo,
  ajuda,
  marcado,
  className,
}: {
  nome: string;
  rotulo: string;
  ajuda?: string;
  marcado?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-start gap-3 rounded-lg border p-3", className)}
    >
      <input
        id={nome}
        name={nome}
        type="checkbox"
        defaultChecked={marcado}
        className="accent-primary mt-0.5 size-4"
      />
      <div className="grid gap-0.5 leading-tight">
        <Label htmlFor={nome} className="cursor-pointer">
          {rotulo}
        </Label>
        {ajuda && <p className="text-muted-foreground text-xs">{ajuda}</p>}
      </div>
    </div>
  );
}
