/**
 * Leitura de variavel de ambiente com erro claro quando falta.
 *
 * O problema que isto resolve: antes o codigo escrevia
 * `process.env.MINHA_VAR!`. Aquele `!` e o "non-null assertion" do
 * TypeScript — ele nao confere nada em tempo de execucao, so manda o
 * compilador calar a boca. Se a variavel faltasse, o valor seguia como
 * `undefined` e o erro estourava la na frente, dentro da biblioteca do
 * Supabase, com uma mensagem que nao diz qual variavel faltou.
 *
 * ---------------------------------------------------------------------------
 * Por que a funcao recebe o VALOR e tambem o NOME, em vez de so o nome?
 * ---------------------------------------------------------------------------
 * Seria mais curto escrever `exigirVariavel("NEXT_PUBLIC_SUPABASE_URL")` e
 * ler `process.env[nome]` aqui dentro. So que isso QUEBRA no navegador.
 *
 * No servidor (Node), `process.env` e um objeto de verdade e qualquer chave
 * pode ser lida em tempo de execucao. No navegador nao existe `process` —
 * quem resolve isso e o compilador do Next, que durante o build procura no
 * codigo-fonte o texto literal `process.env.NEXT_PUBLIC_ALGUMA_COISA` e o
 * troca pelo valor, como se fosse um "localizar e substituir".
 *
 * Ou seja: a substituicao e TEXTUAL. `process.env[nome]`, com a chave numa
 * variavel, nao casa com esse padrao, nao e substituido, e no navegador vira
 * `undefined`.
 *
 * Por isso a chamada fica assim:
 *
 *     exigirVariavel(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL")
 *
 * O texto literal continua no fonte (o Next consegue substituir), e o nome
 * repetido serve so para a mensagem de erro.
 *
 * Em Java ou PHP isso nao acontece: `System.getenv("X")` e `getenv('X')`
 * rodam em tempo de execucao. Aqui parte do codigo e compilada para dentro do
 * bundle do navegador, e essa e a diferenca.
 */
export function exigirVariavel(
  valor: string | undefined,
  nome: string,
): string {
  if (!valor) {
    throw new Error(
      `Variavel de ambiente ausente: ${nome}.\n` +
        `Local: copie o .env.example para .env.local e preencha.\n` +
        `Vercel: Project Settings > Environment Variables (e refaca o deploy, ` +
        `porque as variaveis NEXT_PUBLIC_ entram no build).`,
    );
  }

  return valor;
}
