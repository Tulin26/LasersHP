/**
 * Comprimento de onda -> cor.
 *
 * ---------------------------------------------------------------------------
 * Por que isto existe
 * ---------------------------------------------------------------------------
 * O catalogo ainda nao tem fotos dos equipamentos. A saida facil seria um
 * icone cinza de "imagem indisponivel" em cada card — que e exatamente o que
 * faz uma pagina parecer inacabada.
 *
 * A saida escolhida usa o dado que o negocio ja tem: todo laser e definido
 * pelo comprimento de onda dele. 808 nm nao e um numero decorativo, e o que
 * determina que aquele aparelho atinge o foliculo piloso; 10600 nm e o que
 * faz o CO2 vaporizar agua no tecido. Transformar esse numero na cor
 * correspondente do espectro da a cada equipamento uma identidade propria,
 * verdadeira e impossivel de confundir com template.
 *
 * ---------------------------------------------------------------------------
 * A fisica, resumida
 * ---------------------------------------------------------------------------
 * O olho humano enxerga de ~380 nm (violeta) a ~700 nm (vermelho). Acima
 * disso e infravermelho: invisivel. Como a maior parte dos lasers de uso
 * clinico trabalha no infravermelho, a cor mostrada ali e uma CONVENCAO —
 * vermelho profundo escurecendo conforme o comprimento aumenta. Nao e o que
 * o olho veria (nao veria nada), e sim uma forma honesta de representar
 * "mais longe no espectro".
 */

/** Matiz em oklch para um comprimento de onda em nanometros. */
function matizDoComprimento(nm: number): { matiz: number; croma: number; luz: number } {
  // Faixa visivel: segue a ordem real do arco-iris.
  if (nm < 450) return { matiz: 295, croma: 0.19, luz: 0.45 }; // violeta
  if (nm < 490) return { matiz: 255, croma: 0.17, luz: 0.52 }; // azul
  if (nm < 520) return { matiz: 200, croma: 0.13, luz: 0.62 }; // ciano
  if (nm < 565) return { matiz: 145, croma: 0.17, luz: 0.66 }; // verde
  if (nm < 590) return { matiz: 95, croma: 0.16, luz: 0.78 }; // amarelo
  if (nm < 625) return { matiz: 55, croma: 0.18, luz: 0.68 }; // laranja
  if (nm <= 700) return { matiz: 28, croma: 0.19, luz: 0.58 }; // vermelho

  /*
   * Infravermelho. Invisivel ao olho, entao a representacao e convencional:
   * parte do vermelho e vai escurecendo e perdendo saturacao conforme se
   * afasta — a sensacao de "sair do visivel".
   */
  const distancia = Math.min((nm - 700) / 1200, 1); // 700..1900 nm -> 0..1
  return {
    matiz: 25 - distancia * 12,
    croma: 0.17 - distancia * 0.09,
    luz: 0.5 - distancia * 0.16,
  };
}

/** Uma cor oklch pronta para usar em CSS. */
export function corDoComprimento(nm: number): string {
  const { matiz, croma, luz } = matizDoComprimento(nm);
  return `oklch(${luz.toFixed(3)} ${croma.toFixed(3)} ${matiz.toFixed(1)})`;
}

/**
 * Le o texto da coluna `comprimento_onda` e devolve os numeros.
 *
 * O campo e texto livre porque a realidade nao cabe num numero: um aparelho
 * de triplice onda guarda "755 / 808 / 1064" e a luz pulsada guarda uma
 * faixa, "400-1200".
 */
export function lerComprimentos(texto: string | null): number[] {
  if (!texto) return [];

  const numeros = texto
    .match(/\d+/g)
    ?.map(Number)
    .filter((n) => n >= 200 && n <= 20000);

  return numeros ?? [];
}

export type FaixaEspectro = {
  /** Cores na ordem, uma por comprimento de onda. */
  cores: string[];
  /** Degrade pronto para `background-image`. */
  degrade: string;
  /** Rotulo curto: "808 nm", "755 / 808 / 1064 nm". */
  rotulo: string | null;
  /** Falso quando o equipamento nao e luz (radiofrequencia, criolipolise). */
  ehLuz: boolean;
};

/**
 * Monta a faixa de espectro de um equipamento.
 *
 * Quando nao ha comprimento de onda — radiofrequencia e criolipolise nao sao
 * luz — devolve um degrade neutro na cor da marca. O card continua com
 * identidade visual, so nao finge uma informacao que nao existe.
 */
export function faixaDoEquipamento(
  comprimentoOnda: string | null,
): FaixaEspectro {
  const nms = lerComprimentos(comprimentoOnda);

  if (nms.length === 0) {
    return {
      cores: ["var(--marca-clara)", "var(--marca)"],
      degrade:
        "linear-gradient(115deg, var(--marca-clara), var(--marca) 70%)",
      rotulo: null,
      ehLuz: false,
    };
  }

  const cores = nms.map(corDoComprimento);

  // Com um comprimento so, o degrade precisa de um segundo ponto para nao
  // virar uma chapa lisa: repetimos a cor mais escura no fim.
  const pontos =
    cores.length === 1
      ? [cores[0], corDoComprimento(nms[0] + 250)]
      : cores;

  return {
    cores,
    degrade: `linear-gradient(115deg, ${pontos.join(", ")})`,
    rotulo: `${comprimentoOnda} nm`,
    ehLuz: true,
  };
}
