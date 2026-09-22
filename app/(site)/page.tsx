import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardEquipamento } from "@/components/site/card-equipamento";
import { ListaAnimada } from "@/components/site/lista-animada";
import { PainelEspectro } from "@/components/site/painel-espectro";
import {
  DuasFrentes,
  EspectroCatalogo,
} from "@/components/site/espectro-catalogo";
import {
  buscarConfiguracoes,
  listarDestaques,
  listarProdutosPublicos,
} from "@/lib/consultas/site";
import { montarLinkWhatsApp, mensagemGenerica } from "@/lib/whatsapp";

/**
 * Home da vitrine.
 *
 * E um Server Component assincrono: da para escrever `await` direto no corpo
 * do componente, sem useEffect e sem estado de carregando. O HTML ja sai
 * pronto do servidor, com os produtos dentro — o Google le tudo e o celular
 * nao precisa executar JavaScript para ver o conteudo.
 */


export default async function PaginaInicial() {
  // Promise.all dispara as duas consultas ao mesmo tempo. Se fossem dois
  // await em sequencia, a segunda so comecaria depois da primeira terminar.
  const [config, destaques, catalogo] = await Promise.all([
    buscarConfiguracoes(),
    listarDestaques(3),
    listarProdutosPublicos(),
  ]);

  // "ambas" conta para as duas frentes: um CO2 fracionado interessa tanto a
  // clinica de estetica quanto ao consultorio que trata ferida.
  const contagem = {
    estetica: catalogo.filter((p) => p.area !== "saude").length,
    saude: catalogo.filter((p) => p.area !== "estetica").length,
  };

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
                  Tirar dúvidas no WhatsApp
                </Button>
              )}
            </div>
          </div>

          {/* O painel e renderizado no servidor; o PainelEspectro so
              acrescenta movimento por cima. Sem JavaScript, o espectro
              continua ali, completo e legivel. */}
          <PainelEspectro>
            <EspectroCatalogo produtos={catalogo} />
          </PainelEspectro>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* As duas frentes                                                   */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16">
        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Para quem você atende?
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          O equipamento certo muda conforme o consultório. Escolha o seu lado e
          veja só o que faz sentido para você.
        </p>

        <div className="mt-6">
          <DuasFrentes contagem={contagem} />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Destaques do catalogo                                            */}
      {/* ---------------------------------------------------------------- */}
      {destaques.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                Equipamentos em destaque
              </h2>
              <p className="text-muted-foreground mt-2">
                Uma amostra do que temos disponível agora.
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

          <ListaAnimada className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {destaques.map((produto, indice) => (
              <CardEquipamento
                key={produto.id}
                produto={produto}
                prioridade={indice === 0}
              />
            ))}
          </ListaAnimada>

          <Button
            render={<Link href="/equipamentos" />}
            variant="outline"
            className="mt-8 w-full sm:hidden"
          >
            Ver catálogo completo
          </Button>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Sobre                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section id="sobre" className="bg-muted/40 border-t">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
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
