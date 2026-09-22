import { corDoComprimento, lerComprimentos, significadoDaFaixa } from "@/lib/espectro";
import { ETIQUETA_AREA } from "@/lib/areas";
import type { AreaAtuacao } from "@/lib/tipos/database.types";

/**
 * Ficha tecnica do equipamento.
 *
 * ---------------------------------------------------------------------------
 * Por que esta secao existe
 * ---------------------------------------------------------------------------
 * A pagina de detalhe tinha nome, preco, descricao e indicacoes. Falta o dado
 * que de fato decide a compra: o comprimento de onda, e o que ele significa.
 *
 * Quem compra um laser nao escolhe pela foto — escolhe pelo comprimento de
 * onda, porque e ele que determina a que profundidade a luz chega e o que ela
 * encontra pelo caminho: melanina, hemoglobina ou agua. Um site que mostra
 * "808 nm" e para por ai obriga o visitante a procurar o significado em outro
 * lugar, e esse outro lugar costuma ser o concorrente.
 *
 * Quando o equipamento nao e luz — radiofrequencia e criolipolise — a secao
 * diz isso com todas as letras em vez de inventar um numero.
 */
/**
 * Junta comprimentos de onda que caem na mesma faixa do espectro.
 *
 * Sem isso, um aparelho de triplice onda (755, 808 e 1064 nm) rendia tres
 * paragrafos identicos: os tres estao no infravermelho proximo, entao alvo e
 * uso tipico se repetiam palavra por palavra. Repeticao literal na tela nao
 * informa — cansa, e ainda passa a impressao de texto gerado no automatico.
 *
 * Agrupados, a leitura vira "755 / 808 / 1064 nm · Infravermelho proximo",
 * uma linha so, que e exatamente como um tecnico descreveria o aparelho.
 */
function agrupar(nms: number[]) {
  const grupos: {
    faixa: string;
    alvo: string;
    usoTipico: string;
    valores: number[];
  }[] = [];

  for (const nm of nms) {
    const info = significadoDaFaixa(nm);
    const existente = grupos.find((g) => g.faixa === info.faixa);

    if (existente) existente.valores.push(nm);
    else grupos.push({ ...info, valores: [nm] });
  }

  return grupos;
}

export function FichaTecnica({
  comprimentoOnda,
  area,
  modelo,
}: {
  comprimentoOnda: string | null;
  area: AreaAtuacao;
  modelo: string | null;
}) {
  const nms = lerComprimentos(comprimentoOnda);
  const etiqueta = ETIQUETA_AREA[area];

  return (
    <section className="bg-muted/40 rounded-xl border p-5 sm:p-6">
      <h2 className="font-heading font-semibold">Ficha técnica</h2>

      <dl className="mt-4 space-y-3 text-sm">
        {modelo && (
          <div className="flex justify-between gap-4 border-b pb-3">
            <dt className="text-muted-foreground">Modelo</dt>
            <dd className="text-right font-mono">{modelo}</dd>
          </div>
        )}

        <div className="flex justify-between gap-4 border-b pb-3">
          <dt className="text-muted-foreground">Indicado para</dt>
          <dd className="text-right font-medium">{etiqueta.curto}</dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Comprimento de onda</dt>
          <dd className="text-right font-mono tabular-nums">
            {comprimentoOnda ? (
              `${comprimentoOnda} nm`
            ) : (
              <span className="text-muted-foreground font-sans">
                Não se aplica
              </span>
            )}
          </dd>
        </div>
      </dl>

      {nms.length === 0 ? (
        <p className="text-muted-foreground mt-4 border-t pt-4 text-sm leading-relaxed">
          Este equipamento não trabalha com luz. O efeito vem de outro
          princípio físico — calor por radiofrequência ou resfriamento
          controlado —, então não há comprimento de onda a informar.
        </p>
      ) : (
        <div className="mt-4 space-y-3 border-t pt-4">
          {/*
            Um bloco por FAIXA do espectro, nao por comprimento de onda: ver
            a funcao agrupar() acima. Um aparelho que cobre faixas diferentes
            atinge alvos biologicos diferentes, e e isso que justifica ele
            custar mais que um de onda unica — vale deixar explicito.
          */}
          {agrupar(nms).map(({ faixa, alvo, usoTipico, valores }) => (
            <div key={faixa} className="flex gap-3">
              <span
                className="mt-1 h-full w-1 shrink-0 rounded-full"
                style={{ backgroundColor: corDoComprimento(valores[0]) }}
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium">
                  <span className="font-mono tabular-nums">
                    {valores.join(" / ")} nm
                  </span>
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    · {faixa}
                  </span>
                </p>
                <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
                  Absorvido por <strong className="font-medium">{alvo}</strong>.{" "}
                  {usoTipico}.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
