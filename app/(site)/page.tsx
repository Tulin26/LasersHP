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
import { buscarConfiguracoes, listarDestaques } from "@/lib/consultas/site";
import { montarLinkWhatsApp, mensagemGenerica } from "@/lib/whatsapp";

/**
 * Home da vitrine.
 *
 * E um Server Component assincrono: da para escrever `await` direto no corpo
 * do componente, sem useEffect e sem estado de carregando. O HTML ja sai
 * pronto do servidor, com os produtos dentro — o Google le tudo e o celular
 * nao precisa executar JavaScript para ver o conteudo.
 */

const DIFERENCIAIS = [
  {
    icone: BadgeCheck,
    titulo: "Equipamentos homologados",
    texto:
      "Aparelhos com registro e documentacao em dia para uso profissional.",
  },
  {
    icone: Headset,
    titulo: "Suporte de verdade",
    texto:
      "Atendimento direto com quem conhece o equipamento, antes e depois da compra.",
  },
  {
    icone: Truck,
    titulo: "Entrega para todo o Brasil",
    texto: "Envio com embalagem adequada e acompanhamento ate a instalacao.",
  },
  {
    icone: ShieldCheck,
    titulo: "Garantia e assistencia",
    texto: "Cobertura de garantia e orientacao de manutencao preventiva.",
  },
];

export default async function PaginaInicial() {
  // Promise.all dispara as duas consultas ao mesmo tempo. Se fossem dois
  // await em sequencia, a segunda so comecaria depois da primeira terminar.
  const [config, destaques] = await Promise.all([
    buscarConfiguracoes(),
    listarDestaques(3),
  ]);

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Chamada principal                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="fundo-vitrine border-b">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-primary text-sm font-medium tracking-wide uppercase">
              {config.nome_negocio}
            </p>

            <h1 className="mt-3 text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
              {config.titulo_home}
            </h1>

            <p className="text-muted-foreground mt-5 max-w-prose text-lg leading-relaxed">
              {config.subtitulo_home}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button render={<Link href="/equipamentos" />} size="lg">
                Ver equipamentos
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
                  size="lg"
                  variant="outline"
                >
                  Tirar duvidas no WhatsApp
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {DIFERENCIAIS.map(({ icone: Icone, titulo, texto }) => (
              <div
                key={titulo}
                className="bg-card/70 rounded-xl border p-4 backdrop-blur"
              >
                <Icone className="text-primary size-5" aria-hidden="true" />
                <h2 className="mt-3 text-sm font-semibold">{titulo}</h2>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  {texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Destaques do catalogo                                            */}
      {/* ---------------------------------------------------------------- */}
      {destaques.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Equipamentos em destaque
              </h2>
              <p className="text-muted-foreground mt-2">
                Uma amostra do que temos disponivel agora.
              </p>
            </div>

            <Button
              render={<Link href="/equipamentos" />}
              variant="ghost"
              className="hidden sm:inline-flex"
            >
              Ver todos
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {destaques.map((produto, indice) => (
              <CardEquipamento
                key={produto.id}
                produto={produto}
                prioridade={indice === 0}
              />
            ))}
          </div>

          <Button
            render={<Link href="/equipamentos" />}
            variant="outline"
            className="mt-8 w-full sm:hidden"
          >
            Ver catalogo completo
          </Button>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Sobre                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section id="sobre" className="bg-muted/40 border-t">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Sobre a {config.nome_negocio}
          </h2>

          <p className="text-muted-foreground mt-4 leading-relaxed whitespace-pre-line">
            {config.texto_sobre ||
              "Trabalhamos com equipamentos de laser para estetica, atendendo clinicas e profissionais que precisam de tecnologia confiavel e suporte proximo. Fale com a gente e conte o que voce precisa: indicamos o aparelho certo para o seu atendimento."}
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
