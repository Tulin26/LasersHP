import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Headset,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardEquipamento } from "@/components/site/card-equipamento";
import { TrilhoLasers } from "@/components/site/trilho-lasers";
import { buscarConfiguracoes, listarDestaques } from "@/lib/consultas/site";
import { montarLinkWhatsApp, mensagemGenerica } from "@/lib/whatsapp";

/**
 * Home da vitrine.
 *
 * E um Server Component assincrono: da para escrever `await` direto no corpo
 * do componente, sem useEffect e sem estado de carregando. O HTML ja sai
 * pronto do servidor, com os aparelhos dentro — o Google le tudo e o celular
 * nao precisa executar JavaScript para ver o conteudo.
 *
 * A primeira dobra e o trilho de aparelhos, que e o unico pedaco interativo
 * da pagina. Os textos editaveis pelo painel (titulo_home e subtitulo_home)
 * vem logo abaixo dele: perderam o lugar de destaque, mas continuam sendo a
 * primeira frase que o visitante le depois de ver os equipamentos.
 */

const DIFERENCIAIS = [
  {
    icone: BadgeCheck,
    titulo: "Linha DMC completa",
    texto:
      "Therapy, E-LIB e E-light no mesmo lugar, para comparar antes de decidir.",
  },
  {
    icone: Headset,
    titulo: "Quem atende conhece o aparelho",
    texto: "Orientacao de uso antes da compra e suporte depois dela.",
  },
  {
    icone: Truck,
    titulo: "Entrega para todo o Brasil",
    texto: "Envio com embalagem adequada e acompanhamento ate a chegada.",
  },
  {
    icone: ShieldCheck,
    titulo: "Garantia do fabricante",
    texto: "Cobertura de garantia e orientacao de manutencao preventiva.",
  },
];

export default async function PaginaInicial() {
  // Promise.all dispara as duas consultas ao mesmo tempo. Se fossem dois
  // await em sequencia, a segunda so comecaria depois da primeira terminar.
  const [config, destaques] = await Promise.all([
    buscarConfiguracoes(),
    listarDestaques(6),
  ]);

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* O trilho de aparelhos                                            */}
      {/* ---------------------------------------------------------------- */}
      {destaques.length > 0 && (
        <TrilhoLasers produtos={destaques} whatsapp={config.whatsapp} />
      )}

      {/* ---------------------------------------------------------------- */}
      {/* A frase do negocio e os diferenciais                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-border border-t">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16">
          <div>
            <p className="rotulo">{config.nome_negocio}</p>
            <h2 className="mt-3 text-2xl leading-tight tracking-tight text-balance sm:text-3xl">
              {config.titulo_home}
            </h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              {config.subtitulo_home}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button render={<Link href="/equipamentos" />}>
                Ver todos os aparelhos
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>

              {config.whatsapp && (
                <Button
                  render={
                    <a
                      href={montarLinkWhatsApp(
                        config.whatsapp,
                        mensagemGenerica(config.nome_negocio),
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                  variant="outline"
                >
                  Tirar duvidas no WhatsApp
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {DIFERENCIAIS.map(({ icone: Icone, titulo, texto }) => (
              <div key={titulo}>
                <Icone
                  className="text-[var(--titanio)] size-5"
                  aria-hidden="true"
                />
                <h3 className="mt-3 text-sm font-semibold">{titulo}</h3>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Catalogo                                                          */}
      {/* ---------------------------------------------------------------- */}
      {destaques.length > 0 && (
        <section className="border-border border-t">
          <div className="mx-auto w-full max-w-7xl px-4 py-14">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-xl tracking-tight sm:text-2xl">
                Todos os aparelhos
              </h2>

              <Button
                render={<Link href="/equipamentos" />}
                variant="ghost"
                className="hidden sm:inline-flex"
              >
                Ver catalogo
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {destaques.slice(0, 4).map((produto) => (
                <CardEquipamento key={produto.id} produto={produto} />
              ))}
            </div>

            <Button
              render={<Link href="/equipamentos" />}
              variant="outline"
              className="mt-8 w-full sm:hidden"
            >
              Ver catalogo completo
            </Button>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Sobre                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section id="sobre" className="border-border border-t">
        <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
          <h2 className="text-xl tracking-tight sm:text-2xl">
            Sobre a {config.nome_negocio}
          </h2>

          <p className="text-muted-foreground mt-4 leading-relaxed whitespace-pre-line">
            {config.texto_sobre ||
              "Trabalhamos com aparelhos de laserterapia da DMC, atendendo dentistas, fisioterapeutas, enfermeiros e esteticistas que precisam de tecnologia confiavel e suporte proximo. Fale com a gente e conte o que voce atende: indicamos o aparelho certo para a sua rotina."}
          </p>

          {config.whatsapp && (
            <Button
              render={
                <a
                  href={montarLinkWhatsApp(
                    config.whatsapp,
                    mensagemGenerica(config.nome_negocio),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              size="lg"
              className="mt-8"
            >
              Conversar agora
            </Button>
          )}
        </div>
      </section>
    </>
  );
}
