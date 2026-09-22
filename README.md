# LaserHP

Site de encomendas e painel administrativo (mini ERP) para venda de
equipamentos de laser para estetica.

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

**Vitrine publica**

- Home com textos editaveis pelo painel e equipamentos em destaque
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
   **Auto Confirm User**). A senha precisa ter no minimo 6 caracteres — e
   regra do Supabase, nao da aplicacao.
3. Escolha **um** dos dois:
   - `0003_dados_demo.sql` — configura o admin `admin@gmail.com`, grava o
     WhatsApp do negocio e cria equipamentos, clientes, vendedores, vendas e
     pedidos de exemplo, para voce ver o sistema funcionando. Traz no fim um
     bloco comentado que apaga so a demonstracao.
   - `0002_criar_admin.sql` — so o acesso, sem dado nenhum. Troque o e-mail
     pelo seu antes de rodar.

Sem o passo 3 o login funciona mas o painel fica vazio, porque o RLS nao
reconhece o usuario.

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

## Seguranca

Lista de verificacao com o que foi conferido, como foi conferido e o que
ficou pendente: [`SEGURANCA.md`](SEGURANCA.md). Cada item registra o teste
que produziu a resposta, para poder ser repetido.

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
