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

Abra http://localhost:3000, clique em **Area restrita** no rodape e entre com
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

## 7. Quando algo der errado

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

## 8. Limites do plano gratuito

O projeto foi feito para caber no gratuito dos dois servicos, sem processo em
segundo plano e sem tarefa longa. Vale saber onde estao os tetos:

- **Funcao da Vercel**: a exportacao de Excel recusa acima de 20.000 linhas e
  a importacao acima de 2.000 linhas ou 5 MB. Se precisar de mais, filtre por
  periodo e faca em partes.
- **Upload de fotos**: vai do navegador direto para o Supabase Storage, sem
  passar pela Vercel. Limite de 5 MB por foto, definido na aplicacao.
- **Supabase gratuito**: o projeto e pausado depois de um periodo sem uso.
  Se o site "sumir", entre no painel do Supabase e clique em **Restore**.
