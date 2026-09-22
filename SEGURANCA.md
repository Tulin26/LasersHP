# Seguranca do LaserHP

Lista de verificacao com o que foi conferido, **como** foi conferido e o que
ficou pendente. Cada item diz o teste que produziu a resposta — a ideia e que
qualquer pessoa possa repetir e chegar ao mesmo resultado, em vez de
acreditar numa afirmacao.

Data da revisao: 22/09/2026.

---

## Resumo

| # | Item | Situacao |
|---|------|----------|
| 1 | Esconder as API keys | corrigido |
| 2 | Limpar secrets do git | corrigido |
| 3 | Chave publica no banco | ja estava correto |
| 4 | Ativar RLS | ja estava correto |
| 5 | Criptografia de dados | coberto pela plataforma |
| 6 | Auth no servidor | ja estava correto |
| 7 | Restringir acesso aos registros | ja estava correto |
| 8 | Bloquear mass assignment | ja estava correto |
| 9 | Proteger cookies | **corrigido — era falha real** |
| 10 | Hash nas senhas | ja estava correto |
| 11 | Rate limit no login | **corrigido — nao existia** |
| 12 | Protecao contra robo | ja estava correto |
| 13 | Queries parametrizadas | ja estava correto |
| 14 | Validacao de entradas | ja estava correto |
| 15 | Vazamento de conteudo | **corrigido — estoque era publico** |
| 16 | Restringir uploads | corrigido |
| 17 | Enxugar respostas de API | corrigido |
| 18 | Cabecalhos de seguranca | **corrigido — nao existiam** |
| 19 | Forcar HTTPS | ja vinha da Vercel |
| 20 | Varredura de dependencias | limpo |

---

## 1. Esconder as API keys

As chaves vivem so em variaveis de ambiente. A leitura passa por
[`exigirVariavel`](lib/ambiente.ts), que falha dizendo o nome da variavel
que faltou, em vez do antigo `process.env.X!` — aquele `!` nao confere nada
em tempo de execucao, so silencia o compilador.

**Como foi conferido:** procura pelo valor real das chaves dentro de
`.next/static`, que e exatamente o que o navegador baixa.

```
chave SECRETA no bundle : 0 arquivo(s)
SALT_HASH_IP no bundle  : 0 arquivo(s)
chave PUBLICA no bundle : 1 arquivo(s)  <- essa PODE aparecer
```

O `utils/supabase/admin.ts` comeca com `import "server-only"`: se algum
componente de navegador importar aquele arquivo, o build quebra em vez de
mandar a chave secreta para o navegador.

## 2. Limpar secrets do git

Nenhuma API key foi commitada. Os `.env.example` do historico tem so
placeholder, e as strings parecidas com token no `package-lock.json` sao hash
`sha512` de integridade.

O vazamento real era outro: o `DEPLOY.md` publicava a senha do painel num
repositorio **publico**, com o sistema no ar. O historico foi reescrito e a
senha trocada.

> **Licao que vale repetir:** depois do force-push, o GitHub **continuou
> servindo o commit antigo** pelo SHA direto (HTTP 200, com a senha dentro).
> Reescrever historico tira da vista, nao desvaza. Segredo exposto tem um
> unico conserto: trocar.

## 3. Chave publica no banco

A chave em uso e `sb_publishable_` (formato novo), nao o JWT `anon` legado.
Ela aparece no navegador de proposito — quem protege os dados e o RLS.

**Como foi conferido:** chamadas a API com a chave publica e sem login.

| Tabela | Resultado |
|---|---|
| `produtos`, `configuracoes` | le (e a vitrine) |
| `clientes`, `vendas`, `venda_itens`, `vendedores`, `perfis`, `pedidos` | 0 linhas |
| INSERT em `pedidos` | 201, permitido |
| INSERT em qualquer outra | 401 do RLS |

## 4. Ativar RLS

As 8 tabelas tem RLS ligado, com 29 policies. A `tentativas_login`, criada
na migracao 0004, tem RLS ligado e **nenhuma** policy: so as funcoes
`security definer` a alcancam.

**Como foi conferido:** a tabela de tentativas respondeu `[]` a chave publica,
e as funcoes do freio responderam 404 e 401.

## 5. Criptografia de dados

- **Em transito:** HTTPS no site e na API do Supabase, certificados validos.
  O `http://` e redirecionado com 308 antes de qualquer dado trafegar.
- **Em repouso:** disco criptografado pelo Supabase (garantia da plataforma).
- **Senhas:** nunca guardadas por nos — ver item 10.
- **IP e e-mail nas tabelas de limite:** nao sao guardados em texto. Viram
  `sha256` com tempero secreto, um caminho so de ida. Contam sem identificar.

Nao ha criptografia por coluna em `clientes`. Para este porte a conta nao
fecha: a aplicacao precisaria descriptografar para exibir, entao qualquer
comprometimento do servidor revelaria o dado do mesmo jeito, e buscas por
nome deixariam de funcionar. A protecao ali e o RLS mais o disco
criptografado.

## 6. Auth no servidor

Toda checagem usa `supabase.auth.getUser()`, que valida o token **no servidor
do Supabase**. `getSession()` nao aparece em lugar nenhum — ele apenas le o
cookie e acredita no conteudo, o que nao serve para autorizar.

Sao tres camadas: `proxy.ts` (checagem otimista) -> `exigirSessao()` /
`exigirAdmin()` em cada pagina -> RLS no Postgres, que e a autoridade final.

## 7. Restringir acesso aos registros

Um vendedor enxerga apenas as proprias vendas. Isso nao e um `if` no codigo:
e a policy `vendedor le as proprias vendas`, que o Postgres aplica.

**Como foi conferido:** foi criado um usuario de teste ligado a uma vendedora
com 3 das 7 vendas, e depois removido.

```
vendas         3     (de 7 no banco)
venda_itens    4     (so os dela)
vendedores     1     (de 3)
perfis         1     (o proprio)

pedindo pelo id exato uma venda de outro vendedor: devolveu VAZIO
tentando baixar o preco de um produto:            nao alterou nada
```

## 8. Bloquear mass assignment

As Server Actions leem campo por campo do `FormData` e montam um objeto
explicito. Nao existe `Object.fromEntries(formData)` em lugar nenhum: um
`<input name="papel" value="admin">` adicionado na mao nunca chega ao banco,
porque aquele nome nunca e lido.

No banco a mesma regra aparece de novo, na policy de pedidos:

```sql
with check (
  status = 'novo'
  and cliente_id is null
  and char_length(nome) between 2 and 120
  ...
)
```

## 9. Proteger cookies  — era falha real

O `@supabase/ssr` grava o cookie de sessao **sem `httpOnly`**, porque a
biblioteca supoe que o cliente do navegador precisa ler a sessao.

**O que foi medido, antes:**

```
httpOnly=false  secure=false  sameSite=Lax
document.cookie -> devolvia o access token E o refresh token
```

Qualquer falha de XSS levaria a sessao inteira, de forma duradoura (o refresh
token renova sozinho). Agora o cookie vai `httpOnly`, `secure` em producao e
`sameSite=lax`.

Isso quebrava o upload de fotos, que usava a sessao do navegador para falar
com o Storage. Trocado por **URL assinada**: o servidor confere que quem pede
e admin e devolve um token que vale para um caminho so. O arquivo continua
indo direto para o Supabase, sem passar pela Vercel — que era a razao
original de enviar pelo navegador.

**Depois:**

```
httpOnly=true  secure=true  sameSite=Lax
JavaScript enxerga o cookie de sessao: nao
```

## 10. Hash nas senhas

Nenhuma senha passa perto do nosso codigo: quem guarda e o schema `auth` do
Supabase, com bcrypt. O schema nao tem coluna de senha em tabela nenhuma.

A senha minima e 6 caracteres — regra do Supabase, que recusa menos com
`weak_password`.

## 11. Rate limit no login — nao existia

**O que foi medido, antes:** 12 senhas erradas seguidas, todas respondidas
com `Invalid login credentials`. Nenhum bloqueio. Forca bruta viavel.

Agora ha dois limites, no banco (e nao em memoria, porque na Vercel cada
requisicao pode cair numa instancia diferente e um contador em variavel seria
zerado o tempo todo):

- **por IP:** 8 falhas em 15 minutos
- **por e-mail:** 15 falhas em 60 minutos

O limite por e-mail e mais frouxo de proposito. Se fosse apertado, bastaria
errar a senha algumas vezes de proposito para **trancar o dono fora do
proprio sistema** — negacao de servico por bloqueio de conta.

**Como foi conferido:** dez tentativas seguidas pelo formulario real.

```
tentativa  8: senha recusada
tentativa  9: BARRADO pelo freio
```

## 12. Protecao contra robo

O formulario da vitrine tem um campo-armadilha (`website`) escondido fora da
tela. Pessoa nenhuma o ve; robo que preenche tudo, preenche. Quando vem
preenchido, a tela responde "enviado" e **nada e gravado** — o robo nao
descobre que foi barrado e nao muda de tatica.

**Como foi conferido:** um robo foi simulado preenchendo o campo por
JavaScript.

```
campo-armadilha presente no HTML: sim
posicao na tela  : x = -9982, numa tela de 390px  (fora da area visivel)
alcancavel com Tab: nao
aria-hidden       : true
pedido no banco   : NENHUM
```

Alem dele, o limite de 5 pedidos por hora por IP.

## 13. Queries parametrizadas

Nao existe SQL montado com concatenacao de texto na aplicacao. Tudo passa
pelo `supabase-js`, que fala com o PostgREST, e as funcoes do banco recebem
parametros tipados (`p_ip_hash text`, `p_produto_id uuid`).

Onde um valor do usuario entra num filtro `ilike`, ele vai como parametro, nao
como pedaco de comando.

## 14. Validacao de entradas

Todo formulario tem um schema Zod, aplicado **no servidor** — validacao de
navegador e conveniencia, nao seguranca, porque pode ser pulada. Os schemas
estao em [`lib/validacoes/`](lib/validacoes/).

A validacao se repete no banco, nos `check` das policies e nos tipos das
colunas. Quem falar direto com a API, sem passar pela aplicacao, encontra a
mesma regra.

## 15. Vazamento de conteudo — era falha real

O RLS filtra **linhas**, nunca **colunas**. A policy "produtos ativos sao
publicos" liberava a linha inteira, e com ela `estoque` e `estoque_minimo`.

**O que foi medido, antes:** qualquer visitante lia, pela API,

```
estoque             = 4
estoque_minimo      = 1
```

de cada equipamento — e, consultando de tempos em tempos, deduzia o ritmo de
vendas do negocio.

A correcao e uma camada diferente do RLS: **grant por coluna**. O visitante
anonimo agora tem permissao em 13 colunas, e `estoque` nao e uma delas. A
vitrine precisa saber se ha unidade, mas nao quantas — para isso entrou a
coluna gerada `disponivel` (`estoque > 0`).

```
GET produtos?select=nome,estoque  ->  42501 permission denied
```

Mensagens de erro tambem nao entregam nada: o login responde "E-mail ou senha
incorretos" quer a conta exista ou nao.

## 16. Restringir uploads

A tela ja conferia tipo e tamanho, mas isso roda no navegador — e tudo que
roda no navegador pode ser pulado com uma chamada direta a API.

Agora a conferencia existe em tres lugares:

1. **No bucket** (`file_size_limit` 5 MB, `allowed_mime_types` com 4 tipos) —
   verificado pelo servidor do Supabase.
2. **Na Server Action**, que so devolve token de upload para tipo conhecido.
3. **Na policy** do Storage, que exige admin.

A extensao do arquivo passou a sair do **tipo validado no servidor**, nao do
nome enviado. Antes, `arquivo.name.split(".").pop()` aceitava qualquer coisa —
inclusive `.html`, num bucket publico.

## 17. Enxugar respostas de API

As consultas da vitrine deixaram de usar `select("*")` e passaram a pedir a
lista de colunas que a tela realmente usa
([`lib/consultas/site.ts`](lib/consultas/site.ts)). Coluna que a tela nao
mostra sai do banco, atravessa a rede e e descartada — alem do problema de
permissao do item 15.

O tipo `ProdutoPublico` existe para o compilador recusar qualquer tentativa de
exibir estoque na vitrine.

## 18. Cabecalhos de seguranca — nao existiam

So havia `Strict-Transport-Security`, que a Vercel poe sozinha. Foram
adicionados:

| Cabecalho | Para que |
|---|---|
| `Content-Security-Policy` | de onde a pagina pode carregar script, estilo, imagem |
| `X-Frame-Options: DENY` | ninguem embute o site num iframe (clickjacking) |
| `X-Content-Type-Options: nosniff` | o navegador nao adivinha tipo de arquivo |
| `Referrer-Policy` | links de saida nao levam a URL completa |
| `Permissions-Policy` | camera, microfone e localizacao desligados |

E o `X-Powered-By: Next.js` foi removido: entregava de graca qual pilha o site
usa.

O CSP usa **nonce por requisicao** — um numero aleatorio que o Next carimba
nos scripts dele. Script injetado nao teria como adivinhar o numero daquela
requisicao.

Uma escolha consciente: `style-src` aceita `unsafe-inline`, porque o
`next/image` escreve no atributo `style` das imagens e ali nao ha onde
carimbar nonce. Estilo injetado no maximo deixa a pagina feia; script
injetado rouba sessao. A defesa que importa continua rigorosa.

**Como foi conferido:** navegador real, build de producao, nas 11 paginas do
site e do painel — nenhuma violacao de CSP, nenhum erro de console, login e
upload funcionando.

## 19. Forcar HTTPS

Ja vinha pronto da Vercel:

```
http://lasers-hp.vercel.app  ->  308 Permanent Redirect para https
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

O `max-age` de dois anos com `preload` faz o navegador nem tentar `http` nas
visitas seguintes.

## 20. Varredura de dependencias

```
npm audit  ->  found 0 vulnerabilities
```

O `xlsx` vem do CDN oficial da SheetJS, e nao do pacote homonimo no npm, que
esta abandonado e com falhas conhecidas.

---

## Pendente

- **Rotacionar a `SUPABASE_SECRET_KEY`.** Ela passou por conversa de chat e
  ignora o RLS por completo. O roteiro esta na secao 7 do
  [DEPLOY.md](DEPLOY.md).
- **Decidir se vendedor deve enxergar o CPF/CNPJ dos clientes.** Hoje
  enxerga. Se nao devesse, a correcao e a mesma do item 15: grant por coluna.
  E regra de negocio, nao decisao tecnica.
