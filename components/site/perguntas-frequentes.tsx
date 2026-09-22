import { ChevronDown } from "lucide-react";
import { Revelar } from "@/components/site/revelar";

/**
 * Perguntas frequentes.
 *
 * ---------------------------------------------------------------------------
 * Por que faltava, e por que nao e enfeite
 * ---------------------------------------------------------------------------
 * Toda pergunta aqui e uma que hoje chegaria no WhatsApp antes de o visitante
 * decidir qualquer coisa. Respondida na pagina, ela deixa de ocupar o tempo
 * de quem atende — e, principalmente, deixa de ser um motivo para a pessoa
 * adiar o contato.
 *
 * ---------------------------------------------------------------------------
 * Por que <details> e nao um componente de accordion
 * ---------------------------------------------------------------------------
 * O <details>/<summary> e nativo do HTML: abre e fecha sem JavaScript
 * nenhum, ja vem com o comportamento de teclado correto e e anunciado como
 * expansivel pelos leitores de tela sem precisar de ARIA escrita a mao.
 *
 * Um accordion de biblioteca faria o mesmo custando JavaScript no navegador
 * e podendo quebrar a acessibilidade se configurado errado. O que ele daria
 * a mais — a animacao de altura — resolvemos abaixo com `interpolate-size`,
 * que o CSS moderno ja entrega.
 */

const PERGUNTAS = [
  {
    pergunta: "Vocês vendem para quem está começando agora?",
    resposta:
      "Sim. Boa parte dos atendimentos é de profissional montando o primeiro consultório. Nesse caso costumamos indicar um equipamento mais simples: começar pelo aparelho mais caro é o erro mais comum de quem está abrindo.",
  },
  {
    pergunta: "Qual a diferença entre laser para estética e para saúde?",
    resposta:
      "É o comprimento de onda e a potência. O de estética trabalha em faixas absorvidas por melanina e água, para depilação e tratamento de pele. O terapêutico usa potência baixa em faixas absorvidas pela mitocôndria, para cicatrização, dor e inflamação. Alguns aparelhos servem aos dois — a ficha técnica de cada equipamento mostra isso.",
  },
  {
    pergunta: "Preciso de registro na Anvisa para usar?",
    resposta:
      "O equipamento precisa ter registro; quem usa precisa de habilitação compatível com o conselho da sua profissão. Enviamos a documentação do aparelho junto com a proposta, e orientamos sobre o que o seu conselho exige.",
  },
  {
    pergunta: "Tem garantia e assistência?",
    resposta:
      "Sim, com garantia de fábrica e assistência técnica. A orientação de manutenção preventiva vai junto na entrega — a maior parte dos chamados que recebemos seria evitada com ela.",
  },
  {
    pergunta: "Entregam em todo o Brasil?",
    resposta:
      "Sim, com embalagem específica para equipamento óptico e acompanhamento até a instalação. O prazo varia com a região e entra na proposta.",
  },
  {
    pergunta: "Dá para parcelar?",
    resposta:
      "Sim. Trabalhamos com cartão, boleto, transferência e financiamento para pessoa jurídica. As condições vão na proposta, sem compromisso.",
  },
];

export function PerguntasFrequentes() {
  return (
    <section className="border-t">
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <Revelar>
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Dúvidas frequentes
          </h2>
          <p className="text-muted-foreground mt-2">
            Se a sua não estiver aqui, mande no WhatsApp — a resposta costuma
            sair no mesmo dia.
          </p>
        </Revelar>

        <div className="mt-8 divide-y border-t border-b">
          {PERGUNTAS.map((item, i) => (
            <Revelar key={item.pergunta} atraso={Math.min(i, 4) * 0.05}>
              <details className="faq group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-medium select-none">
                  {item.pergunta}
                  <ChevronDown
                    className="text-muted-foreground size-4 shrink-0 transition-transform duration-300 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>

                <div className="faq-corpo">
                  <p className="text-muted-foreground pb-4 text-sm leading-relaxed">
                    {item.resposta}
                  </p>
                </div>
              </details>
            </Revelar>
          ))}
        </div>
      </div>
    </section>
  );
}
