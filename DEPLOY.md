# Colocando o LaserHP no ar

Passo a passo do zero ate o site publicado. Se voce ja fez alguma parte,
pule para a proxima.

---

## 1. Criar as tabelas no Supabase

Sem isso nada funciona: o site abre, mas o catalogo fica vazio e o login
recusa o acesso.

1. Abra o painel do Supabase e entre no projeto **LaserHP**.
2. Menu da esquerda: **SQL Editor** > **New query**.
3. Abra o arquivo `supabase/migrations/0001_schema_inicial.sql` deste
   repositorio, copie **o conteudo inteiro**, cole no editor e clique em
   **Run**.
4. Deve aparecer *Success. No rows returned*. Se aparecer erro, leia a
   mensagem: quase sempre e porque uma parte ja tinha sido rodada antes.

> **Se der o erro `must be owner of table objects`** na parte final (as
> policies do Storage): isso acontece em alguns projetos por causa das
> permissoes da tabela `storage.objects`. Rode o arquivo ate a secao 8 e
> crie as 4 policies do bucket pela interface: **Storage > produtos >
> Policies**.

### Conferir se deu certo

Rode no SQL Editor:

```sql
select table_name
  from information_schema.tables
 where table_schema = 'public'
 order by table_name;
```

Devem aparecer 8 tabelas: `clientes`, `configuracoes`, `pedidos`, `perfis`,
`produtos`, `venda_itens`, `vendas`, `vendedores`.

---

## 2. Criar o seu usuario de administrador

> **Antes de qualquer coisa:** crie o seu usuario com uma senha SUA. Este
> repositorio e publico — nenhuma senha real pode ser escrita aqui, nem em
> comentario, nem em exemplo. O painel fica exposto na internet, entao uma
> senha que apareca no README e o mesmo que nao ter senha.
>
> A senha precisa de no minimo 6 caracteres, senao o Supabase recusa com
> `weak_password: Password should be at least 6 characters`. Use bem mais que
> isso: o `admin@gmail.com` e um e-mail obvio, e a senha e a unica barreira.

### 2.1 Caminho rapido — com dados de exemplo

Primeiro crie o login: **Authentication** > **Users** > **Add user** >
*Create new user*, com o e-mail `admin@gmail.com`, uma senha sua e a caixa
**Auto Confirm User** marcada. O script abaixo da o papel de admin para esse
e-mail, mas nao cria a conta — quem cria contas e o Supabase.

Depois, no **SQL Editor** > cole o [`0003_dados_demo.sql`](supabase/migrations/0003_dados_demo.sql)
inteiro > **Run**. Ele faz tudo de uma vez:

- da o papel de admin para `admin@gmail.com`;
- grava o WhatsApp `(17) 99728-5058` e os textos do site;
- cria 7 equipamentos, 5 clientes, 3 vendedores, 7 vendas e 3 pedidos.

No fim do arquivo ha um bloco comentado que apaga **so** a demonstracao,
preservando o admin e as configuracoes, para quando o sistema entrar em uso
de verdade.

### 2.2 Caminho manual — sem dados de exemplo

1. No Supabase: **Authentication** > **Users** > **Add user** >
   *Create new user*.
2. Preencha e-mail e senha e **marque `Auto Confirm User`** — sem isso o
   Supabase espera uma confirmacao por e-mail que nunca vai chegar.
3. Volte ao **SQL Editor**, abra `supabase/migrations/0002_criar_admin.sql`,
   troque `troque@pelo-seu-email.com` pelo e-mail que voce acabou de criar e
   rode **apenas o bloco 1**.
4. O bloco 3 do arquivo e uma consulta de conferencia. Rode: seu e-mail deve
   aparecer com `papel = admin`.

Para dar acesso a um vendedor depois, repita o processo usando o **bloco 2**
do mesmo arquivo.

---

## 3. Rodar na sua maquina (opcional, mas recomendado)

```bash
npm install
npm run dev
```

Abra http://localhost:3000, clique em **Area restrita** no menu do topo e entre com
o e-mail e a senha do passo 2. Cadastre um equipamento em
**Equipamentos > Novo equipamento** e confira se ele aparece na vitrine.

Se algo falhar aqui, vai falhar na Vercel tambem — melhor descobrir agora.

---

## 4. Publicar na Vercel

### 4.1 Conectar o repositorio

1. Entre em https://vercel.com com a conta do GitHub.
2. **Add New** > **Project** > escolha o repositorio **LasersHP** >
   **Import**.

### 4.2 Conferir o Framework Preset

**Este passo e o que mais causa dor de cabeca.** Se a Vercel nao reconhecer
o projeto como Next.js, ela publica a pasta `public/` como site estatico e
**todas as rotas dao 404**.

Na tela de importacao, em **Framework Preset**, precisa estar escrito
**Next.js**. Se estiver "Other", mude para Next.js.

> O arquivo `vercel.json` na raiz ja forca `"framework": "nextjs"`, entao o
> deploy funciona mesmo se o painel estiver errado. Ainda assim, deixe o
> painel certo: se um dia alguem apagar o `vercel.json`, o site cai.

### 4.3 Cadastrar as variaveis de ambiente

Ainda na tela de importacao (ou depois, em **Settings > Environment
Variables**), cadastre as quatro:

| Nome | Onde encontrar |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > Data API > Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase > Project Settings > API Keys > chave `sb_publishable_...` |
| `SUPABASE_SECRET_KEY` | Supabase > Project Settings > API Keys > chave `sb_secret_...` |
| `NEXT_PUBLIC_SITE_URL` | o endereco final do site, ex.: `https://lasers-hp.vercel.app` |

Marque as tres primeiras para **Production, Preview e Development**.

> A `SUPABASE_SECRET_KEY` ignora todas as regras de seguranca do banco.
> Ela **nunca** pode ganhar o prefixo `NEXT_PUBLIC_`: isso a colocaria dentro
> do JavaScript que vai para o navegador de qualquer visitante.

### 4.4 Deploy

Clique em **Deploy** e espere. No fim, a Vercel mostra o endereco do site.

Daqui em diante todo `git push` na branch `main` publica sozinho.

---

## 5. Ajustes finais depois do primeiro deploy

1. **`NEXT_PUBLIC_SITE_URL`**: se voce so soube o endereco depois do deploy,
   volte em Settings > Environment Variables, corrija e clique em
   **Redeploy** (a variavel so entra numa build nova).

2. **Configuracoes do site**: entre no painel em `/admin/configuracoes` e
   preencha o WhatsApp, o nome do negocio e os textos da home. **O WhatsApp e
   obrigatorio** — sem ele o botao flutuante some e a encomenda nao redireciona
   para lugar nenhum.

3. **Deployment Protection**: se o site pedir login da Vercel para abrir, va em
   **Settings > Deployment Protection** e desligue a protecao para Production.
   Ela vem ligada em algumas contas e deixaria a vitrine inacessivel ao publico.

4. **Cadastre os equipamentos** em `/admin/produtos`.

5. **Cadastre pelo menos um vendedor** em `/admin/vendedores` — sem vendedor
   nao da para registrar venda.

---

## 6. Dominio proprio (opcional)

1. **Settings > Domains > Add** e digite o dominio.
2. A Vercel mostra os registros de DNS para criar no seu provedor.
3. Depois que o dominio propagar, atualize `NEXT_PUBLIC_SITE_URL` para o
   endereco novo e faca um **Redeploy** — e essa variavel que monta os links
   absolutos da previa de compartilhamento.

---

## 7. Trocar as chaves (rotacao)

Uma chave que vazou nao volta a ser secreta. Se ela apareceu num print, num
commit, num grupo de WhatsApp ou numa conversa com uma ferramenta de IA,
o unico conserto e gerar outra e revogar a antiga. Reescrever o historico do
git **nao resolve**: o GitHub continua servindo o commit antigo por alguns
dias se alguem souber o codigo dele.

### 7.1 Chave secreta do Supabase (`SUPABASE_SECRET_KEY`)

E a mais grave das tres: ela ignora o RLS por completo, entao quem a tem le
e escreve qualquer tabela como se fosse dono do banco.

**A ordem importa.** Gere a nova e coloque-a nos dois lugares ANTES de
revogar a velha — enquanto as duas existem, nada fica fora do ar.

1. **Supabase** > **Project Settings** > **API Keys** > aba *Secret keys* >
   **Create new secret key**. Copie o valor (ele so aparece uma vez).
2. **Na sua maquina:** abra o `.env.local` e troque o valor de
   `SUPABASE_SECRET_KEY`. Reinicie o `npm run dev` — variavel de ambiente
   so e lida quando o processo sobe.
3. **Na Vercel:** *Project Settings* > *Environment Variables* > a linha
   `SUPABASE_SECRET_KEY` > **Edit** > cole a nova > **Save**.
4. **Redeploy:** *Deployments* > o ultimo > menu `...` > **Redeploy**.
   Sem isso a Vercel continua rodando com a chave antiga em memoria.
5. **Teste antes de revogar:** abra o site, mande uma encomenda pelo
   formulario e confirme que ela aparece em **Pedidos** no painel. Esse
   caminho e o unico que usa a chave secreta — se ele funciona, a troca deu
   certo.
6. **So agora** volte ao Supabase e apague a chave antiga.

### 7.2 Chave publicavel (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)

Esta **nao e um segredo** e nao precisa ser rotacionada por ter sido vista.
Ela vai dentro do JavaScript que qualquer visitante baixa — e assim por
projeto. Quem protege os dados e o RLS: com essa chave sozinha da para ler
`produtos` e `configuracoes` e gravar em `pedidos`, e mais nada. Clientes,
vendas, vendedores e perfis voltam vazios.

### 7.3 Senha do painel

Trocar em **Authentication** > **Users** > o usuario > `...` >
**Reset password**. Nunca escreva a senha num arquivo do repositorio: este
repositorio e publico.

### 7.4 `SALT_HASH_IP`

Nao e uma credencial de acesso — e o tempero do hash que guarda o IP de quem
manda encomenda, para o hash nao poder ser revertido por forca bruta.
Trocar e inofensivo: o unico efeito e que o limite de 5 pedidos por hora
reinicia. Por isso ela e separada da chave secreta, e nao a propria: assim
rotacionar o Supabase nao zera o controle de spam.


---

## 8. Quando algo der errado

| Sintoma | Causa mais provavel |
| --- | --- |
| 404 em todas as rotas | Framework Preset em "Other". Veja o passo 4.2 |
| 500 logo depois de cadastrar as variaveis | A build e anterior as variaveis. Faca **Redeploy** |
| Painel abre vazio, sem erro | Falta a linha em `perfis`. Rode o `0002_criar_admin.sql` |
| `Could not find the table 'public.produtos'` | O `0001_schema_inicial.sql` nao foi rodado |
| Upload de foto falha com "row-level security" | O usuario nao e admin, ou faltam as policies do bucket (passo 1) |
| Venda falha com "estoque insuficiente" e tem estoque | Rode o `0001` atualizado: a funcao `ajustar_estoque` precisa existir |
| Site pede login da Vercel | Deployment Protection ligada. Veja o passo 5.3 |

---

## 9. Limites do plano gratuito

O projeto foi feito para caber no gratuito dos dois servicos, sem processo em
segundo plano e sem tarefa longa. Vale saber onde estao os tetos:

- **Funcao da Vercel**: a exportacao de Excel recusa acima de 20.000 linhas e
  a importacao acima de 2.000 linhas ou 5 MB. Se precisar de mais, filtre por
  periodo e faca em partes.
- **Upload de fotos**: vai do navegador direto para o Supabase Storage, sem
  passar pela Vercel. Limite de 5 MB por foto, definido na aplicacao.
- **Supabase gratuito**: o projeto e pausado depois de um periodo sem uso.
  Se o site "sumir", entre no painel do Supabase e clique em **Restore**.
