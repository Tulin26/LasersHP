-- ===========================================================================
-- 0004 — Reforco de seguranca
--
-- Tres assuntos independentes, na ordem:
--   1. Freio de forca bruta no login
--   2. Colunas de "produtos" que o visitante anonimo NAO deve enxergar
--   3. Limites de tipo e tamanho no bucket de fotos
--
-- Pode ser rodado mais de uma vez sem estragar nada.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. FREIO DE FORCA BRUTA NO LOGIN
--
-- Por que precisa existir: foi medido que o endpoint de login do Supabase
-- aceitou 12 senhas erradas seguidas sem reclamar. Sem freio, testar milhares
-- de senhas e so questao de tempo de maquina.
--
-- O e-mail e o IP chegam aqui ja transformados em hash pela aplicacao (o
-- mesmo tempero do limite de pedidos). Assim esta tabela nunca guarda de quem
-- foi a tentativa — ela so sabe "alguem", e isso basta para contar.
-- ---------------------------------------------------------------------------
create table if not exists public.tentativas_login (
  id         bigint generated always as identity primary key,
  ip_hash    text not null,
  email_hash text not null,
  sucesso    boolean not null default false,
  criado_em  timestamptz not null default now()
);

create index if not exists tentativas_login_ip_idx
  on public.tentativas_login (ip_hash, criado_em desc);
create index if not exists tentativas_login_email_idx
  on public.tentativas_login (email_hash, criado_em desc);

-- RLS ligado e NENHUMA policy: ninguem le nem escreve pelo PostgREST, nem
-- anonimo nem logado. So as funcoes abaixo (security definer) tocam nela.
alter table public.tentativas_login enable row level security;

-- Dois limites, de proposito:
--
--   por IP     — 8 falhas em 15 min. Pega o ataque comum, de uma maquina so.
--   por e-mail — 15 falhas em 60 min. Pega o ataque distribuido, que troca
--                de IP a cada tentativa.
--
-- O limite por e-mail e mais frouxo por um motivo: se fosse apertado, um
-- atacante erraria a senha de proposito algumas vezes so para TRANCAR o dono
-- de fora do proprio sistema. Isso se chama negacao de servico por bloqueio
-- de conta. Com 15/hora o ataque fica inviavel e o dono, no pior caso,
-- espera uma hora.
create or replace function public.pode_tentar_login(
  p_ip_hash text,
  p_email_hash text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.tentativas_login
      where ip_hash = p_ip_hash and not sucesso
        and criado_em > now() - interval '15 minutes') < 8
    and
    (select count(*) from public.tentativas_login
      where email_hash = p_email_hash and not sucesso
        and criado_em > now() - interval '60 minutes') < 15;
$$;

-- Registra o resultado da tentativa.
--
-- Quando o login da certo, as falhas daquele par (IP + e-mail) sao apagadas:
-- quem errou a senha tres vezes e acertou na quarta nao deve continuar perto
-- do limite.
--
-- A limpeza das linhas velhas acontece aqui mesmo, de carona. No plano
-- gratuito nao ha agendador (pg_cron), entao a alternativa seria a tabela
-- crescer para sempre.
create or replace function public.registrar_tentativa_login(
  p_ip_hash text,
  p_email_hash text,
  p_sucesso boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tentativas_login (ip_hash, email_hash, sucesso)
  values (p_ip_hash, p_email_hash, p_sucesso);

  if p_sucesso then
    delete from public.tentativas_login
     where ip_hash = p_ip_hash
       and email_hash = p_email_hash
       and not sucesso;
  end if;

  -- 1 chance em 20 de limpar o historico velho, para nao pagar esse custo
  -- em toda tentativa de login.
  if random() < 0.05 then
    delete from public.tentativas_login
     where criado_em < now() - interval '24 hours';
  end if;
end;
$$;

-- Quem chama e o servidor da aplicacao com a chave secreta. O visitante
-- anonimo nao pode consultar nem marcar tentativa por conta propria.
revoke execute on function public.pode_tentar_login(text, text)
  from public, anon, authenticated;
revoke execute on function public.registrar_tentativa_login(text, text, boolean)
  from public, anon, authenticated;


-- ---------------------------------------------------------------------------
-- 2. COLUNAS PUBLICAS DE "PRODUTOS"
--
-- O RLS filtra LINHAS, nunca COLUNAS. A policy "produtos ativos sao publicos"
-- libera a linha inteira — e com ela `estoque` e `estoque_minimo`. Medido na
-- API: qualquer visitante conseguia ler quantas unidades existem de cada
-- equipamento e, consultando de tempos em tempos, deduzir o ritmo de vendas
-- do negocio.
--
-- Quem resolve isso e o GRANT por coluna, que e uma camada diferente do RLS.
-- ---------------------------------------------------------------------------

-- A vitrine precisa saber se ha unidade disponivel, mas nao quantas.
-- Coluna gerada = o Postgres mantem sozinho, nao da para ficar desatualizada.
alter table public.produtos
  add column if not exists disponivel boolean
  generated always as (estoque > 0) stored;

do $colunas$
begin
  -- Tira o acesso amplo e devolve so o necessario, coluna por coluna.
  revoke select on public.produtos from anon;

  grant select (
    id, slug, nome, modelo, descricao, indicacoes,
    preco, preco_sob_consulta, imagens,
    ativo,        -- a consulta filtra por ele
    destaque,     -- e ordena por ele
    criado_em,    -- e desempata por ele
    disponivel
  ) on public.produtos to anon;

  raise notice 'produtos: anon le apenas as colunas publicas; estoque e estoque_minimo ficaram de fora.';
end $colunas$;


-- ---------------------------------------------------------------------------
-- 3. LIMITES DO BUCKET DE FOTOS
--
-- A tela ja conferia tipo e tamanho, mas isso roda no NAVEGADOR — e tudo que
-- roda no navegador pode ser pulado. Quem tiver um token de admin consegue
-- falar direto com a API do Storage e mandar o que quiser. Estes dois campos
-- sao verificados pelo servidor do Supabase, entao valem de verdade.
--
-- Vai dentro de um bloco com excecao porque em alguns projetos a tabela
-- storage.buckets pertence a outro dono, e o erro derrubaria a migracao
-- inteira.
-- ---------------------------------------------------------------------------
do $bucket$
begin
  update storage.buckets
     set file_size_limit    = 5242880,  -- 5 MB, igual ao que a tela informa
         allowed_mime_types = array[
           'image/jpeg', 'image/png', 'image/webp', 'image/avif'
         ]
   where id = 'produtos';

  raise notice 'Storage: bucket "produtos" limitado a 5 MB e a 4 tipos de imagem.';
exception
  when insufficient_privilege then
    raise notice 'AVISO: sem permissao para alterar storage.buckets. Faca na mao em Storage > produtos > Settings: File size limit 5MB e Allowed MIME types image/jpeg, image/png, image/webp, image/avif.';
  when others then
    raise notice 'AVISO no trecho de Storage (%): %.', sqlstate, sqlerrm;
end $bucket$;


-- ---------------------------------------------------------------------------
-- CONFERENCIA
-- ---------------------------------------------------------------------------
select 'colunas que o visitante anonimo le em produtos' as verificacao,
       string_agg(column_name, ', ' order by column_name) as resultado
  from information_schema.column_privileges
 where grantee = 'anon'
   and table_schema = 'public'
   and table_name = 'produtos'
   and privilege_type = 'SELECT'
union all
select 'limites do bucket de fotos',
       coalesce(
         file_size_limit::text || ' bytes / ' || array_to_string(allowed_mime_types, ', '),
         'SEM LIMITE — configure na mao'
       )
  from storage.buckets
 where id = 'produtos';
