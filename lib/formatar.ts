/**
 * Funcoes de formatacao usadas na vitrine e no painel.
 *
 * Tudo aqui e puro: entra um valor, sai uma string. Sem acesso a banco e sem
 * "use client" / "use server" — por isso pode ser importado tanto por um
 * Server Component quanto por um Client Component.
 */

const MOEDA = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** 15000 -> "R$ 15.000,00" */
export function formatarMoeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) {
    return MOEDA.format(0);
  }
  return MOEDA.format(valor);
}

/**
 * Datas do Postgres chegam como texto.
 *
 * `date` vem "2026-03-14" e `timestamptz` vem "2026-03-14T18:30:00+00:00".
 * A armadilha: `new Date("2026-03-14")` e interpretado como UTC meia-noite e,
 * no fuso do Brasil, volta um dia. Por isso datas puras sao quebradas na mao.
 */
export function formatarData(valor: string | null | undefined): string {
  if (!valor) return "—";

  const soData = /^\d{4}-\d{2}-\d{2}$/.test(valor);
  if (soData) {
    const [ano, mes, dia] = valor.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  return new Date(valor).toLocaleDateString("pt-BR");
}

/** timestamptz -> "14/03/2026 15:30" */
export function formatarDataHora(valor: string | null | undefined): string {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Deixa so os digitos: "(44) 99999-8888" -> "44999998888" */
export function apenasDigitos(valor: string | null | undefined): string {
  return (valor ?? "").replace(/\D/g, "");
}

/** Mostra o telefone bonitinho, aceitando fixo e celular. */
export function formatarTelefone(valor: string | null | undefined): string {
  const d = apenasDigitos(valor);
  if (d.length === 11)
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length === 13) {
    // com DDI: 55 44 99999 8888
    return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  }
  return valor ?? "—";
}

/** CPF (11) ou CNPJ (14). Qualquer outro tamanho volta como veio. */
export function formatarDocumento(valor: string | null | undefined): string {
  const d = apenasDigitos(valor);
  if (d.length === 11) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  if (d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  return valor ?? "—";
}

/**
 * Transforma o nome do produto na parte da URL: "Laser Diodo 808nm" vira
 * "laser-diodo-808nm". O normalize("NFD") separa a letra do acento e o regex
 * seguinte joga os acentos fora.
 */
export function gerarSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // tira os acentos ja separados
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Primeiro dia do mes atual no formato aceito pelo Postgres (yyyy-mm-dd). */
export function primeiroDiaDoMes(referencia = new Date()): string {
  const d = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
  return paraDataISO(d);
}

/** Ultimo dia do mes atual. */
export function ultimoDiaDoMes(referencia = new Date()): string {
  const d = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0);
  return paraDataISO(d);
}

/** Date -> "2026-03-14" usando o fuso local (nao o UTC). */
export function paraDataISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Corta um texto longo para caber em cards e listagens. */
export function resumir(
  texto: string | null | undefined,
  limite = 140,
): string {
  if (!texto) return "";
  const limpo = texto.trim();
  if (limpo.length <= limite) return limpo;
  return `${limpo.slice(0, limite).trimEnd()}...`;
}
