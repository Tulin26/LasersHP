# LaserHP

Site de encomendas e painel administrativo (mini ERP) para venda de aparelhos
de laserterapia da linha DMC, usados em odontologia, fisioterapia, enfermagem,
estetica e terapia capilar.

O projeto e unico: a vitrine publica e o painel vivem na mesma aplicacao
Next.js, separados por grupos de rota.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Front e back | Next.js 16 (App Router) + TypeScript |
| Interface | Tailwind CSS v4 + shadcn/ui |
| Banco, autenticacao e imagens | Supabase (Postgres + Auth + Storage) |
| Logica de servidor | Server Actions e Route Handlers |
| Validacao | Zod (mesmo schema no cliente e no servidor) |
| Planilhas | SheetJS (xlsx) |
| Hospedagem | Vercel |

## O que o sistema faz

**Vitrine publica** (tema escuro; o painel segue claro)

- Home com o trilho de aparelhos: os destaques apoiados numa mesma bancada, o
  do meio aceso com o brilho vermelho do laser, arrastavel com o dedo, o mouse
  ou as setas do teclado. Ao lado dele, a ficha tecnica que o profissional
  compara antes de comprar
- Textos da home editaveis pelo painel, logo abaixo do trilho
- Catalogo com busca por nome e modelo
- Pagina de cada equipamento, com galeria de fotos e indicacoes de uso
- Formulario de encomenda: grava o pedido no banco **e** redireciona para o
  WhatsApp com a mensagem pronta
- Botao flutuante de WhatsApp em todas as paginas
- Protecao contra spam: campo-armadilha (honeypot) e limite de 5 envios por
  hora por origem
- Metadados de SEO e de compartilhamento (a previa que aparece no WhatsApp)

**Painel** (`/admin`, exige login)

- Painel inicial com total vendido no mes, ticket medio, vendas por vendedor,
  mais vendidos e alerta de estoque baixo
- Pedidos do site: listagem, filtro por situacao, resposta pelo WhatsApp e
  conversao do contato em cliente
- Clientes com historico de compras
- Vendedores
- Equipamentos: cadastro, upload de fotos, controle de estoque
- Vendas com varios itens, desconto, forma de pagamento e filtros por
  periodo, cliente, vendedor e situacao
- Excel: exporta as vendas do filtro atual e importa planilhas no mesmo
  formato, com relatorio de o que entrou e o que falhou
- Configuracoes: WhatsApp, dados do negocio e textos do site

## Rodando na sua maquina

Requer Node.js 20 ou superior.

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
npm run dev
```

A aplicacao sobe em http://localhost:3000.

### Variaveis de ambiente

Estao documentadas em [`.env.example`](.env.example). A regra que importa:

- `NEXT_PUBLIC_*` e embutida no JavaScript enviado ao navegador — qualquer
  pessoa consegue ler.
- `SUPABASE_SECRET_KEY` **nao** tem esse prefixo de proposito: ela ignora
  as regras de seguranca do banco e so pode ser usada em codigo de servidor.
  O arquivo `utils/supabase/admin.ts` comeca com `import "server-only"`, que
  quebra o build se algum componente de navegador tentar importa-lo.

## Banco de dados

Os scripts ficam em [`supabase/migrations/`](supabase/migrations/) e sao
aplicados pelo SQL Editor do Supabase, **nesta ordem**:

1. `0001_schema_inicial.sql` — tabelas, indices, funcoes, RLS e bucket de
   imagens. Rode o arquivo inteiro de uma vez.
2. Crie seu usuario em *Authentication > Users > Add user* (marque
   **Auto Confirm User**).
3. `0002_criar_admin.sql` — troque o e-mail pelo seu e rode. Sem isso o login
   funciona mas o painel fica vazio, porque o RLS nao reconhece o usuario.
4. `0003_ficha_tecnica.sql` — soma em `produtos` os campos que a home mostra
   ao lado do aparelho: aplicacao, potencia, comprimento de onda e as duas
   emissoes.
5. `0004_catalogo_dmc.sql` — cadastra os quatro aparelhos da linha DMC
   (Therapy IA EC, Therapy EC, E-LIB e E-light Cluster) ja apontando para os
   recortes em `public/aparelhos/`.

Os dois ultimos sao seguros de rodar mais de uma vez: o `0003` usa
`add column if not exists` e o `0004` termina com `on conflict do nothing`.

> **Sobre a ficha tecnica.** Os numeros vieram da documentacao do fabricante e
> da distribuidora oficial (Technodontus), e cada um esta creditado em
> comentario dentro do `0004`. O **comprimento de onda do Therapy IA EC ficou
> em branco** porque a DMC nao publica esse dado — a linha simplesmente some
> da vitrine ate alguem preencher no painel. Nao copie do Therapy EC por
> semelhanca: confira na ficha impressa do aparelho.

Todas as tabelas tem Row Level Security ligado. A vitrine enxerga apenas
produtos ativos e as configuracoes; o restante exige login. O vendedor so
enxerga as proprias vendas — a regra mora no banco, nao na aplicacao.

### Duas funcoes que valem conhecer

- `registrar_venda(...)` — cria o cabecalho, os itens e da baixa no estoque
  numa **unica transacao**. Se faltar estoque de qualquer item, nada e
  gravado. E o equivalente ao `@Transactional` do Java.
- `ajustar_estoque(produto, delta)` — soma ou subtrai do estoque com a linha
  travada pelo Postgres. E isto que impede dois pedidos simultaneos de
  venderem a mesma unidade.

## Estrutura

```
app/
  (site)/            vitrine publica — o grupo entre parenteses nao vira URL
  (admin)/           login e painel
  api/vendas/        exportacao e importacao de Excel (Route Handlers)
components/
  site/              componentes da vitrine
  painel/            componentes do painel
  ui/                shadcn/ui
public/
  aparelhos/         recortes dos aparelhos usados no trilho da home
lib/
  acoes/             Server Actions (escrita)
  consultas/         leituras dos Server Components
  validacoes/        schemas Zod
  tipos/             tipos do banco
utils/supabase/      clientes do Supabase (navegador, servidor e admin)
supabase/migrations/ scripts SQL do banco
proxy.ts             renova a sessao e protege as rotas /admin
```

> No Next.js 16 o antigo `middleware.ts` foi descontinuado e renomeado para
> `proxy.ts`. A funcao exportada chama-se `proxy`.

### As tres camadas de protecao do /admin

1. `proxy.ts` — redireciona quem nao tem sessao. E checagem **otimista**, so
   para a experiencia.
2. `exigirSessao()` / `exigirAdmin()` — rodam dentro de cada pagina.
3. **RLS no Postgres** — a ultima palavra. Vale mesmo que 1 e 2 falhem, e
   mesmo para quem chamar a API do Supabase direto, sem passar pelo site.

## Planilha de vendas

A exportacao gera um `.xlsx` com uma linha por item vendido:

| Coluna | Observacao |
| --- | --- |
| Codigo | identificador curto da venda; linhas com o mesmo codigo sao itens da mesma venda |
| Data, Produto, Modelo, Quantidade | |
| Valor unitario, Valor total | |
| Comprador, Vendedor | pelo nome |
| Forma de pagamento, Status | |
| Desconto da venda, Total da venda, Observacoes | |

Na importacao, as colunas obrigatorias sao **Data, Produto, Quantidade,
Valor total, Comprador, Vendedor e Status**. Vale saber:

- O **produto** e o **vendedor** precisam ja existir no cadastro; o
  **comprador** e criado automaticamente se nao existir.
- Cada linha e avaliada sozinha: uma linha com erro nao derruba as outras,
  ela aparece no relatorio com o numero da linha e o motivo.
- Por padrao a importacao **nao mexe no estoque**, porque a planilha costuma
  trazer vendas antigas. Marque a opcao na tela se quiser dar baixa.
- Limites do plano gratuito: 5 MB e 2000 linhas por arquivo.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com recarga automatica |
| `npm run build` | Build de producao |
| `npm start` | Sobe o build de producao |
| `npm run lint` | ESLint |

## Deploy

Passo a passo completo em [`DEPLOY.md`](DEPLOY.md).

Resumo: a Vercel esta conectada a este repositorio e todo push na branch
`main` publica automaticamente. As mesmas variaveis do `.env.local` precisam
estar em *Project Settings > Environment Variables*.

## Uma observacao sobre o SheetJS

O `package.json` aponta o `xlsx` para `https://cdn.sheetjs.com/...` em vez do
npm. Nao e descuido: a copia publicada no npm parou na versao 0.18.5 e tem
falhas conhecidas justamente na **leitura** de arquivos — que e exatamente o
que a importacao faz. O CDN e o canal oficial do projeto e entrega a 0.20.3,
ja corrigida. O `package-lock.json` guarda o endereco e o hash de integridade,
entao `npm ci` na Vercel baixa sempre o mesmo arquivo verificado.

## As fotos do trilho

Os quatro arquivos em `public/aparelhos/` foram recortados das artes oficiais
da DMC: fundo removido, aparelho apoiado na base de uma tela de 1000x1500.

Duas decisoes que valem conhecer:

- **A tela e igual para os quatro, e o aparelho ocupa dentro dela a altura que
  tem em relacao aos outros.** O E-LIB e de pulso: ele sai com 61% da altura,
  contra 100% das canetas Therapy. Se cada arquivo saisse "cortado justo", o
  navegador normalizaria todos pela altura da caixa e um aparelho de pulso
  apareceria do tamanho de uma caneta de 20 cm.
- **O caminho comeca com `/`.** A funcao `urlDaImagem()` entende tres formas:
  URL completa (`https://...`), caminho da pasta `public/` (comecando com `/`)
  e caminho do Supabase Storage (qualquer outra coisa). E por isso que estes
  recortes convivem com as fotos que o painel envia.

Para trocar por fotos proprias, o ideal sao **PNGs com fundo transparente**,
com o aparelho apoiado na base da imagem. Basta substituir os arquivos ou
apontar o campo de fotos do produto para as novas imagens no painel.
