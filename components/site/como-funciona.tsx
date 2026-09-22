import { Revelar } from "@/components/site/revelar";

/**
 * Como funciona a compra.
 *
 * ---------------------------------------------------------------------------
 * Por que faltava
 * ---------------------------------------------------------------------------
 * O site pedia para a pessoa mandar uma encomenda sem nunca explicar o que
 * acontece depois de clicar. Num produto de quarenta mil reais que nao se
 * compra no carrinho, esse silencio e caro: o visitante nao sabe se vai ser
 * cobrado, se alguem vai ligar, quanto tempo demora. Na duvida, ele fecha a
 * aba.
 *
 * Quatro passos, do primeiro contato a instalacao. O que cada um faz e
 * remover uma pergunta que hoje o visitante teria que mandar no WhatsApp
 * antes de decidir qualquer coisa.
 */

const PASSOS = [
  {
    numero: "01",
    titulo: "Você conta o que precisa",
    texto:
      "Pelo formulário ou direto no WhatsApp. Diga o tipo de atendimento que você faz — não precisa saber o nome do aparelho.",
  },
  {
    numero: "02",
    titulo: "A gente indica o equipamento",
    texto:
      "Com base no que você atende e no volume de sessões. Se um aparelho mais simples resolver, é ele que vamos indicar.",
  },
  {
    numero: "03",
    titulo: "Proposta com valor e condições",
    texto:
      "Preço fechado, formas de pagamento e prazo de entrega. Sem compromisso e sem cobrança para receber a proposta.",
  },
  {
    numero: "04",
    titulo: "Entrega, instalação e treinamento",
    texto:
      "O equipamento chega configurado. Você recebe orientação de uso e o suporte continua com a mesma pessoa que te atendeu.",
  },
];

export function ComoFunciona() {
  return (
    <section className="border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <Revelar>
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Como funciona
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Equipamento de laser não se compra no carrinho. O caminho até a
            entrega é curto, e começa com uma conversa.
          </p>
        </Revelar>

        <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map((passo, i) => (
            <Revelar key={passo.numero} atraso={i * 0.08}>
              <li className="relative">
                {/*
                  O numero fica grande e quase apagado, atras do titulo. Cumpre
                  a funcao de ordenar a leitura sem competir com o conteudo —
                  diferente de uma bolinha colorida com numero dentro, que e o
                  jeito que toda pagina de servico faz.
                */}
                <span
                  className="font-heading text-muted-foreground/25 block text-5xl leading-none font-semibold tabular-nums"
                  aria-hidden="true"
                >
                  {passo.numero}
                </span>

                <h3 className="font-heading mt-2 font-semibold">
                  {passo.titulo}
                </h3>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  {passo.texto}
                </p>
              </li>
            </Revelar>
          ))}
        </ol>
      </div>
    </section>
  );
}
