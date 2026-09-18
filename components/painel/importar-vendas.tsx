"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Relatorio = {
  ok?: boolean;
  erro?: string;
  totalLinhas?: number;
  importadas?: number;
  clientesCriados?: number;
  baixouEstoque?: boolean;
  falhas?: { linha: number; motivo: string }[];
};

/**
 * Envio da planilha e relatorio do que entrou.
 *
 * Aqui usamos fetch() na mao, e nao um <form action={serverAction}>, porque
 * precisamos do JSON de resposta para montar o relatorio na tela. O arquivo
 * vai como multipart/form-data, igual a um upload de formulario comum.
 *
 * Repare que NAO definimos o Content-Type: quando o corpo e um FormData, o
 * navegador escreve o cabecalho sozinho, junto com o "boundary" que separa
 * as partes. Se voce definir na mao, o boundary some e o servidor nao
 * consegue mais separar os campos.
 */
export function ImportarVendas() {
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const formulario = evento.currentTarget;
    const dados = new FormData(formulario);

    setEnviando(true);
    setRelatorio(null);

    try {
      const resposta = await fetch("/api/vendas/importar", {
        method: "POST",
        body: dados,
      });

      const json: Relatorio = await resposta.json();
      setRelatorio(json);

      if (json.ok && (json.importadas ?? 0) > 0) {
        formulario.reset();
        // Recarrega os dados do servidor para a listagem mostrar o que entrou.
        router.refresh();
      }
    } catch {
      setRelatorio({
        erro: "Falha de conexao ao enviar o arquivo. Tente de novo.",
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={enviar} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="arquivo">Arquivo .xlsx</Label>
          <input
            id="arquivo"
            name="arquivo"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            required
            className="border-input file:bg-muted file:text-foreground w-full rounded-lg border p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm"
          />
          <p className="text-muted-foreground text-xs">
            Use o mesmo formato do arquivo exportado. Colunas obrigatorias:
            Data, Produto, Quantidade, Valor total, Comprador, Vendedor e
            Status.
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-lg border p-3">
          <input
            name="baixar_estoque"
            type="checkbox"
            className="accent-primary mt-0.5 size-4"
          />
          <span className="grid gap-0.5 leading-tight">
            <span className="text-sm font-medium">
              Dar baixa no estoque destas vendas
            </span>
            <span className="text-muted-foreground text-xs">
              Deixe desmarcado para importar historico antigo — esses
              equipamentos ja sairam do estoque na vida real.
            </span>
          </span>
        </label>

        <Button type="submit" disabled={enviando}>
          {enviando ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Importando...
            </>
          ) : (
            <>
              <FileUp className="size-4" aria-hidden="true" />
              Importar planilha
            </>
          )}
        </Button>
      </form>

      {/* ------------------------------------------------------------- */}
      {/* Relatorio                                                      */}
      {/* ------------------------------------------------------------- */}
      {relatorio?.erro && (
        <p className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {relatorio.erro}
        </p>
      )}

      {relatorio?.ok && (
        <div className="space-y-3 rounded-lg border p-4">
          <div>
            <h3 className="font-semibold">Relatorio da importacao</h3>
            <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
              <li>
                Linhas lidas: <strong>{relatorio.totalLinhas}</strong>
              </li>
              <li>
                Vendas importadas:{" "}
                <strong className="text-emerald-700">
                  {relatorio.importadas}
                </strong>
              </li>
              {(relatorio.clientesCriados ?? 0) > 0 && (
                <li>
                  Clientes criados automaticamente:{" "}
                  <strong>{relatorio.clientesCriados}</strong>
                </li>
              )}
              <li>
                Estoque:{" "}
                <strong>
                  {relatorio.baixouEstoque
                    ? "baixado normalmente"
                    : "nao foi alterado"}
                </strong>
              </li>
            </ul>
          </div>

          {relatorio.falhas && relatorio.falhas.length > 0 && (
            <div>
              <p className="text-destructive text-sm font-medium">
                {relatorio.falhas.length}{" "}
                {relatorio.falhas.length === 1
                  ? "linha nao entrou"
                  : "linhas nao entraram"}
                :
              </p>
              <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto text-sm">
                {relatorio.falhas.map((f) => (
                  <li
                    key={`${f.linha}-${f.motivo}`}
                    className="flex gap-2 border-b py-1 last:border-0"
                  >
                    <span className="text-muted-foreground shrink-0 tabular-nums">
                      Linha {f.linha}
                    </span>
                    <span>{f.motivo}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-2 text-xs">
                Corrija essas linhas na planilha e importe de novo — as vendas
                que ja entraram nao sao duplicadas, porque so as linhas
                corrigidas estarao no arquivo novo.
              </p>
            </div>
          )}

          {relatorio.falhas?.length === 0 && (
            <p className="text-sm text-emerald-700">
              Todas as linhas foram importadas sem erro.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
