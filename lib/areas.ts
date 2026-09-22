import type { AreaAtuacao } from "@/lib/tipos/database.types";

/**
 * As duas frentes do negocio, em um lugar so.
 *
 * Centralizar aqui tem o mesmo motivo do lib/constantes.ts: o banco guarda
 * 'estetica', a tela mostra "Estetica". Se amanha entrar uma frente nova no
 * enum do SQL, o `Record<AreaAtuacao, ...>` faz o TypeScript apontar
 * exatamente os lugares que faltam atualizar.
 *
 * As cores vem das variaveis do globals.css. `oklch(from var(--x) l c h / a)`
 * le a cor da variavel e troca so a opacidade — assim o fundo da etiqueta e
 * sempre a mesma cor da frente, mais clara, sem ninguem precisar escolher um
 * segundo tom na mao e sem quebrar no modo escuro.
 */
export const ETIQUETA_AREA: Record<
  AreaAtuacao,
  { curto: string; longo: string; descricao: string; fundo: string; texto: string }
> = {
  estetica: {
    curto: "Estética",
    longo: "Clínicas e esteticistas",
    descricao:
      "Depilação, rejuvenescimento, manchas e gordura localizada. Para quem atende beleza e bem-estar.",
    fundo: "oklch(from var(--estetica) l c h / 0.14)",
    texto: "var(--estetica)",
  },
  saude: {
    curto: "Saúde",
    longo: "Laserterapia e reabilitação",
    descricao:
      "Fotobiomodulação, cicatrização de feridas, dor e ILIB. Para enfermagem, fisioterapia e odontologia.",
    fundo: "oklch(from var(--saude) l c h / 0.14)",
    texto: "var(--saude)",
  },
  ambas: {
    curto: "Estética e saúde",
    longo: "Serve às duas frentes",
    descricao:
      "Equipamentos que atendem tanto o consultório de estética quanto o de saúde.",
    fundo: "oklch(from var(--marca) l c h / 0.12)",
    texto: "var(--marca)",
  },
};

export const ORDEM_AREAS: AreaAtuacao[] = ["estetica", "saude", "ambas"];
