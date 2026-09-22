import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardEquipamento } from "@/components/site/card-equipamento";
import { ListaAnimada } from "@/components/site/lista-animada";
import { PainelEspectro } from "@/components/site/painel-espectro";
import { ComoFunciona } from "@/components/site/como-funciona";
import { PerguntasFrequentes } from "@/components/site/perguntas-frequentes";
import { Revelar } from "@/components/site/revelar";
import { TrilhoDestaques } from "@/components/site/trilho-destaques";
import {
  DuasFrentes,
  EspectroCatalogo,
} from "@/components/site/espectro-catalogo";
import {
  buscarConfiguracoes,
  listarDestaques,
  listarProdutosPublicos,
} from "@/lib/consultas/site";
import { capaDoProduto } from "@/lib/imagens";
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
    // Pede TODOS os destaques, nao um punhado.
    //
    // O trilho so consegue mostrar quem tem foto, e o filtro acontece aqui
    // embaixo, em JavaScript. Pedindo poucos ao banco, a conta virava "os N
    // primeiros em ordem alfabetica, e destes, os que tem foto" — um destaque
    // com foto no fim do alfabeto nunca chegava. Foi o que aconteceu com o
    // Therapy EC: os aparelhos DMC comecam com E e com T, e o corte no meio
    // deixava so dois com foto, abaixo do minimo do trilho.
    //
    // A grade de reserva continua usando os tres primeiros desta mesma lista,
    // entao o comportamento dela nao muda.
    listarDestaques(48),
    listarProdutosPublicos(),
  ]);

  // O trilho depende de foto. Sem imagem nao ha o que colocar no palco.
  // O teto de oito e pelos tracinhos de navegacao: o trilho em si so desenha
  // uma janela de cinco pecas por vez, mas uma fileira com vinte tracinhos
  // deixaria de ser navegacao e viraria ruido.
  const comFoto = destaques
    .filter((p) => capaDoProduto(p.imagens))
    .slice(0, 8);

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
            {/*
              Entrada encadeada: marca, titulo, subtitulo e botoes, nessa
              ordem. O atraso crescente conduz o olho na ordem de leitura em
              vez de despejar tudo no mesmo quadro. Sao poucos centesimos
              entre um e outro — o suficiente para dar ritmo, nao para virar
              espera.
            */}
            <Revelar aoCarregar>
              <p className="text-primary text-sm font-medium tracking-wide uppercase">
                {config.nome_negocio}
              </p>
            </Revelar>

            <Revelar aoCarregar atraso={0.08}>
              <h1 className="mt-3 text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
                {config.titulo_home}
              </h1>
            </Revelar>

            <Revelar aoCarregar atraso={0.16}>
              <p className="text-muted-foreground mt-5 max-w-prose text-lg leading-relaxed">
                {config.subtitulo_home}
              </p>
            </Revelar>

            <Revelar aoCarregar atraso={0.24} className="mt-8 flex flex-col gap-3 sm:flex-row">
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
            </Revelar>
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
        <>
          <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  Equipamentos em destaque
                </h2>
                <p className="text-muted-foreground mt-2">
                  {comFoto.length >= 3
                    ? "Arraste para ver cada um de perto."
                    : "Uma amostra do que temos disponível agora."}
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
          </section>

          {/*
            O trilho so entra quando ha pelo menos tres equipamentos COM FOTO.
            Ele existe para mostrar o aparelho; com o cadastro sem imagem
            sobraria uma faixa escura e vazia, entao a grade de cards — que
            tem um lugar reservado para "sem foto" — continua atendendo.
          */}
          {comFoto.length >= 3 ? (
            <>
              <TrilhoDestaques
                produtos={comFoto}
                whatsapp={config.whatsapp}
              />

              <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:hidden">
                <Button
                  render={<Link href="/equipamentos" />}
                  variant="outline"
                  className="w-full"
                >
                  Ver catálogo completo
                </Button>
              </div>
            </>
          ) : (
            <section className="mx-auto w-full max-w-6xl px-4 pb-16">
              <ListaAnimada className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {destaques.slice(0, 3).map((produto, indice) => (
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
        </>
      )}

      <ComoFunciona />

      <PerguntasFrequentes />

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
