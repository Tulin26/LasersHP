-- ===========================================================================
-- LaserHP — schema inicial
-- Rode este arquivo inteiro em: Supabase > SQL Editor > New query > Run
--
-- Decisões desta versão:
--   * venda tem VÁRIOS itens (tabela venda_itens)
--   * vitrine grava pedido direto, com policy de INSERT para anon
--   * vendedor tem login próprio e só enxerga as próprias vendas
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. TIPOS (enums)
-- Enum em vez de texto livre: o Supabase gera tipos TypeScript a partir daqui,
-- então o editor já acusa erro se você escrever um status inexistente.
-- ---------------------------------------------------------------------------
create type public.status_pedido   as enum ('novo', 'em_contato', 'fechado', 'cancelado');
create type public.status_venda    as enum ('pago', 'pendente', 'cancelado');
create type public.forma_pagamento as enum ('pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia', 'financiamento', 'outro');
create type public.papel_usuario   as enum ('admin', 'vendedor');

-- ---------------------------------------------------------------------------
-- 2. GATILHO GENÉRICO DE atualizado_em
-- ---------------------------------------------------------------------------
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. TABELAS
-- ---------------------------------------------------------------------------

-- Perfis: quem entra no painel. E-mail e senha ficam em auth.users (tabela do
-- próprio Supabase); aqui guardamos só nome e papel.
create table public.perfis (
  id            uuid primary key references auth.users(id) on delete cascade,
  nome          text not null default '',
  papel         public.papel_usuario not null default 'vendedor',
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Vendedores. usuario_id liga o cadastro ao login do Supabase Auth; fica nulo
-- para vendedor que não acessa o sistema (ex.: criado pela importação do Excel).
create table public.vendedores (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid unique references auth.users(id) on delete set null,
  nome          text not null,
  telefone      text,
  email         text,
  ativo         boolean not null default true,
  observacoes   text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.produtos (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,           -- usado na URL /equipamentos/[slug]
  nome               text not null,
  modelo             text,
  descricao          text,
  indicacoes         text,                           -- indicações de uso
  preco              numeric(12,2) check (preco is null or preco >= 0),
  preco_sob_consulta boolean not null default false, -- true => vitrine mostra "sob consulta"
  estoque            integer not null default 0 check (estoque >= 0),
  estoque_minimo     integer not null default 1 check (estoque_minimo >= 0),
  imagens            text[] not null default '{}',   -- caminhos no Storage; posição 0 = capa
  ativo              boolean not null default true,  -- false => some da vitrine
  destaque           boolean not null default false,
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);

create index produtos_ativo_idx   on public.produtos (ativo) where ativo;
create index produtos_estoque_idx on public.produtos (estoque);
-- A importação do Excel procura o produto pelo nome; este índice torna a busca
-- sem diferenciar maiúsculas/minúsculas rápida. De propósito NÃO é unique:
-- dois equipamentos podem ter o mesmo nome e modelos diferentes.
create index produtos_nome_idx on public.produtos (lower(nome));

create table public.clientes (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  telefone      text,
  email         text,
  documento     text,                                 -- CPF/CNPJ, só dígitos
  cidade        text,
  observacoes   text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Evita cadastrar o mesmo CPF/CNPJ duas vezes, mas permite vários sem documento.
create unique index clientes_documento_idx on public.clientes (documento) where documento is not null;

-- Pedidos = o que chega pelo formulário da vitrine (lead).
create table public.pedidos (
  id            uuid primary key default gen_random_uuid(),
  produto_id    uuid references public.produtos(id) on delete set null,
  nome          text not null,
  telefone      text not null,
  email         text,
  cidade        text,
  mensagem      text,
  status        public.status_pedido not null default 'novo',
  cliente_id    uuid references public.clientes(id) on delete set null, -- preenchido ao converter
  ip_hash       text,                                 -- hash do IP, para limitar spam
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index pedidos_status_idx on public.pedidos (status, criado_em desc);
create index pedidos_ip_idx     on public.pedidos (ip_hash, criado_em desc);

-- Venda = o cabeçalho. Os equipamentos vendidos ficam em venda_itens.
create table public.vendas (
  id              uuid primary key default gen_random_uuid(),
  data            date not null default current_date,
  cliente_id      uuid not null references public.clientes(id)   on delete restrict,
  vendedor_id     uuid not null references public.vendedores(id) on delete restrict,
  pedido_id       uuid references public.pedidos(id) on delete set null, -- origem, se veio do site
  -- subtotal é mantido por gatilho a partir de venda_itens (ver seção 5).
  subtotal        numeric(12,2) not null default 0 check (subtotal >= 0),
  desconto        numeric(12,2) not null default 0 check (desconto >= 0),
  -- Coluna calculada pelo banco: ninguém grava um total que não bate com as contas.
  total           numeric(12,2) generated always as (subtotal - desconto) stored,
  forma_pagamento public.forma_pagamento not null default 'pix',
  status          public.status_venda not null default 'pendente',
  observacoes     text,
  criado_por      uuid references auth.users(id) on delete set null,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  -- Desconto não pode engolir a venda inteira.
  constraint desconto_nao_passa_do_subtotal check (subtotal - desconto >= 0)
);

create index vendas_data_idx     on public.vendas (data desc);
create index vendas_cliente_idx  on public.vendas (cliente_id);
create index vendas_vendedor_idx on public.vendas (vendedor_id);
create index vendas_status_idx   on public.vendas (status);

create table public.venda_itens (
  id             uuid primary key default gen_random_uuid(),
  venda_id       uuid not null references public.vendas(id)   on delete cascade,
  produto_id     uuid not null references public.produtos(id) on delete restrict,
  quantidade     integer not null check (quantidade > 0),
  valor_unitario numeric(12,2) not null check (valor_unitario >= 0),
  subtotal       numeric(12,2) generated always as (quantidade * valor_unitario) stored,
  criado_em      timestamptz not null default now()
);

create index venda_itens_venda_idx   on public.venda_itens (venda_id);
create index venda_itens_produto_idx on public.venda_itens (produto_id);

-- Configurações do site: uma única linha (id sempre = 1).
create table public.configuracoes (
  id             smallint primary key default 1 check (id = 1),
  nome_negocio   text not null default 'LaserHP',
  whatsapp       text not null default '',   -- só dígitos, com DDI: 5544999998888
  email_contato  text,
  cidade         text,
  instagram      text,
  titulo_home    text not null default '',
  subtitulo_home text not null default '',
  texto_sobre    text,
  seo_titulo     text,
  seo_descricao  text,
  og_imagem_url  text,
  atualizado_em  timestamptz not null default now()
);

insert into public.configuracoes (id) values (1) on conflict (id) do nothing;

-- Gatilhos de atualizado_em
create trigger t_perfis        before update on public.perfis        for each row execute function public.tocar_atualizado_em();
create trigger t_vendedores    before update on public.vendedores    for each row execute function public.tocar_atualizado_em();
create trigger t_produtos      before update on public.produtos      for each row execute function public.tocar_atualizado_em();
create trigger t_clientes      before update on public.clientes      for each row execute function public.tocar_atualizado_em();
create trigger t_pedidos       before update on public.pedidos       for each row execute function public.tocar_atualizado_em();
create trigger t_vendas        before update on public.vendas        for each row execute function public.tocar_atualizado_em();
create trigger t_configuracoes before update on public.configuracoes for each row execute function public.tocar_atualizado_em();

-- ---------------------------------------------------------------------------
-- 4. QUEM É QUEM
-- security definer: estas funções ignoram o RLS ao ler perfis/vendedores.
-- Sem isso, a policy da tabela perfis consultaria perfis, em recursão infinita.
-- ---------------------------------------------------------------------------
create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfis p
     where p.id = auth.uid() and p.papel = 'admin'
  );
$$;

-- Devolve o id do vendedor ligado ao usuário logado (null se for admin puro).
create or replace function public.meu_vendedor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select v.id from public.vendedores v where v.usuario_id = auth.uid() limit 1;
$$;

-- Admin OU vendedor: qualquer pessoa da equipe com acesso ao painel.
create or replace function public.eh_equipe()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.perfis p where p.id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- 5. TOTAL DA VENDA
-- Toda vez que um item entra, muda ou sai, o subtotal do cabeçalho é refeito.
-- É security definer porque o gatilho precisa escrever em "vendas" mesmo
-- quando quem está inserindo o item é um vendedor com permissão limitada.
-- ---------------------------------------------------------------------------
create or replace function public.recalcular_total_venda()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
  v_id  uuid;
begin
  -- Atenção: em gatilho de DELETE a variável NEW nem existe (ler NEW ali dá
  -- erro "record new is not assigned yet"), por isso o desvio por TG_OP.
  if tg_op = 'DELETE' then
    v_ids := array[old.venda_id];
  elsif tg_op = 'UPDATE' and old.venda_id is distinct from new.venda_id then
    v_ids := array[old.venda_id, new.venda_id];   -- item trocou de venda
  else
    v_ids := array[new.venda_id];
  end if;

  foreach v_id in array v_ids loop
    update public.vendas v
       set subtotal = coalesce(
         (select sum(i.subtotal) from public.venda_itens i where i.venda_id = v_id),
         0
       )
     where v.id = v_id;
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger t_venda_itens_total
after insert or update or delete on public.venda_itens
for each row execute function public.recalcular_total_venda();

-- ---------------------------------------------------------------------------
-- 5.1 BAIXA E DEVOLUÇÃO DE ESTOQUE
--
-- Por que uma função separada: registrar_venda é "security invoker", ou seja,
-- roda com as permissões de quem chamou — e o vendedor NÃO tem policy de
-- update em produtos (só o admin tem). Sem isto, a venda de um vendedor
-- atualizaria 0 linhas e morreria com "estoque insuficiente" mesmo com o
-- estoque cheio.
--
-- Esta função é "security definer": ela roda com os poderes do dono e ignora
-- o RLS. O portão de entrada é o eh_equipe() da primeira linha — é ele que
-- garante que só quem tem acesso ao painel consegue mexer no estoque.
--
-- O "and estoque >= -p_delta" dentro do UPDATE é o que torna a baixa segura
-- com dois pedidos simultâneos: o Postgres tranca a linha do produto, o
-- segundo UPDATE só enxerga o estoque já descontado e, se não sobrar, não
-- afeta nenhuma linha — em vez de gravar um estoque negativo.
-- ---------------------------------------------------------------------------
create or replace function public.ajustar_estoque(p_produto_id uuid, p_delta integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_linhas integer;
begin
  if not public.eh_equipe() then
    raise exception 'SEM_PERMISSAO' using errcode = 'P0001';
  end if;

  if p_delta = 0 then
    return;
  end if;

  if p_delta < 0 then
    update public.produtos
       set estoque = estoque + p_delta
     where id = p_produto_id
       and estoque >= -p_delta;
  else
    update public.produtos
       set estoque = estoque + p_delta
     where id = p_produto_id;
  end if;

  get diagnostics v_linhas = row_count;

  if v_linhas = 0 then
    raise exception 'ESTOQUE_INSUFICIENTE:%', p_produto_id using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.ajustar_estoque(uuid, integer) from public;
grant  execute on function public.ajustar_estoque(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. BAIXA DE ESTOQUE SEM CONDIÇÃO DE CORRIDA
--
-- O segredo está no "and estoque >= quantidade" dentro do UPDATE: o Postgres
-- trava a linha do produto durante a atualização, então duas vendas simultâneas
-- do último equipamento são serializadas e a segunda encontra 0 linhas afetadas.
-- Ler o estoque antes e decidir no TypeScript NÃO seria seguro.
--
-- A função inteira roda em uma transação: se o terceiro item falhar, a baixa
-- dos dois primeiros e a venda são desfeitas automaticamente.
--
-- p_itens chega como JSON:
--   [{"produto_id":"uuid","quantidade":1,"valor_unitario":15000.00}, ...]
--
-- p_baixar_estoque = false é usado pela importação do Excel, quando a planilha
-- traz vendas antigas que já saíram do estoque na vida real.
-- ---------------------------------------------------------------------------
create or replace function public.registrar_venda(
  p_cliente_id      uuid,
  p_vendedor_id     uuid,
  p_itens           jsonb,
  p_desconto        numeric                 default 0,
  p_forma_pagamento public.forma_pagamento  default 'pix',
  p_status          public.status_venda     default 'pendente',
  p_data            date                    default current_date,
  p_pedido_id       uuid                    default null,
  p_observacoes     text                    default null,
  p_baixar_estoque  boolean                 default true
)
returns public.vendas
language plpgsql
security invoker              -- o RLS continua valendo: cada um só cria o que pode
set search_path = public
as $$
declare
  v_item    record;
  v_venda   public.vendas;
begin
  if p_itens is null or jsonb_array_length(p_itens) = 0 then
    raise exception 'VENDA_SEM_ITENS' using errcode = 'P0001';
  end if;

  -- 1) Cabeçalho com desconto zero. O desconto entra no fim, porque a trava
  --    "subtotal - desconto >= 0" só pode ser avaliada depois que os itens
  --    existirem e o subtotal tiver sido calculado pelo gatilho.
  insert into public.vendas (
    data, cliente_id, vendedor_id, pedido_id,
    forma_pagamento, status, observacoes, criado_por
  ) values (
    p_data, p_cliente_id, p_vendedor_id, p_pedido_id,
    p_forma_pagamento, p_status, p_observacoes, auth.uid()
  )
  returning * into v_venda;

  -- 2) Itens + baixa de estoque
  for v_item in
    select *
      from jsonb_to_recordset(p_itens)
        as x(produto_id uuid, quantidade integer, valor_unitario numeric)
  loop
    if v_item.quantidade is null or v_item.quantidade <= 0 then
      raise exception 'QUANTIDADE_INVALIDA' using errcode = 'P0001';
    end if;

    if p_baixar_estoque then
      -- delta negativo = saída. A função é quem tranca a linha e recusa
      -- a venda quando o estoque não cobre a quantidade.
      perform public.ajustar_estoque(v_item.produto_id, -v_item.quantidade);
    end if;

    insert into public.venda_itens (venda_id, produto_id, quantidade, valor_unitario)
    values (v_venda.id, v_item.produto_id, v_item.quantidade, v_item.valor_unitario);
  end loop;

  -- 3) Agora sim o desconto. Se passar do subtotal, a constraint derruba tudo.
  update public.vendas
     set desconto = coalesce(p_desconto, 0)
   where id = v_venda.id
  returning * into v_venda;

  return v_venda;
end;
$$;

-- Todo mundo (inclusive anon) recebe EXECUTE por padrão via PUBLIC; revogar
-- "from anon" não adiantaria nada, porque a permissão vem de PUBLIC.
revoke execute on function public.registrar_venda from public;
grant  execute on function public.registrar_venda to authenticated;

-- Cancelar venda devolvendo os equipamentos ao estoque.
create or replace function public.cancelar_venda(p_venda_id uuid)
returns public.vendas
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_venda public.vendas;
  v_item  record;
begin
  select * into v_venda from public.vendas where id = p_venda_id for update;

  if not found then
    raise exception 'VENDA_NAO_ENCONTRADA' using errcode = 'P0002';
  end if;

  if v_venda.status = 'cancelado' then
    return v_venda;   -- já cancelada: não devolve estoque duas vezes
  end if;

  for v_item in select produto_id, quantidade from public.venda_itens where venda_id = p_venda_id
  loop
    -- delta positivo = devolução ao estoque
    perform public.ajustar_estoque(v_item.produto_id, v_item.quantidade);
  end loop;

  update public.vendas
     set status = 'cancelado'
   where id = p_venda_id
  returning * into v_venda;

  return v_venda;
end;
$$;

revoke execute on function public.cancelar_venda from public;
grant  execute on function public.cancelar_venda to authenticated;

-- ---------------------------------------------------------------------------
-- 7. FREIO DE SPAM NA VITRINE
-- Chamada pelo servidor antes de gravar o pedido. É security definer porque
-- o visitante anônimo não tem permissão de LER a tabela pedidos — só de inserir.
-- ---------------------------------------------------------------------------
create or replace function public.pode_enviar_pedido(p_ip_hash text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select count(*) < 5
    from public.pedidos
   where ip_hash = p_ip_hash
     and criado_em > now() - interval '1 hour';
$$;

-- ---------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- Com o RLS ligado e nenhuma policy, ninguém lê nada — nem com a chave
-- publicável exposta no navegador. Cada policy abaixo é uma permissão pontual.
--
-- Resumindo os papéis:
--   anon     (visitante) -> lê produtos ativos e configurações; insere pedido
--   vendedor             -> lê catálogo/pedidos, cadastra cliente,
--                           cria e enxerga APENAS as próprias vendas
--   admin                -> tudo
-- ---------------------------------------------------------------------------
alter table public.perfis        enable row level security;
alter table public.vendedores    enable row level security;
alter table public.produtos      enable row level security;
alter table public.clientes      enable row level security;
alter table public.pedidos       enable row level security;
alter table public.vendas        enable row level security;
alter table public.venda_itens   enable row level security;
alter table public.configuracoes enable row level security;

-- ---- VITRINE PÚBLICA ----
create policy "produtos ativos sao publicos" on public.produtos
  for select to anon, authenticated using (ativo = true);

create policy "configuracoes sao publicas" on public.configuracoes
  for select to anon, authenticated using (true);

-- Escrita pública, restrita: o visitante só consegue criar um lead novo.
-- O with check impede que ele escolha status, já vincule um cliente ou
-- despeje textos gigantes no banco. Repare que NÃO existe policy de SELECT
-- para anon: quem envia não consegue ler os pedidos de ninguém.
create policy "qualquer um pode enviar pedido" on public.pedidos
  for insert to anon
  with check (
    status = 'novo'
    and cliente_id is null
    and char_length(nome) between 2 and 120
    and char_length(telefone) between 8 and 20
    and char_length(coalesce(mensagem, '')) <= 2000
    and char_length(coalesce(cidade, '')) <= 120
    and char_length(coalesce(email, '')) <= 160
  );

-- ---- PERFIS ----
create policy "ver o proprio perfil" on public.perfis
  for select to authenticated using (id = auth.uid() or public.eh_admin());

create policy "editar o proprio perfil" on public.perfis
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "admin gerencia perfis" on public.perfis
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

-- ---- PRODUTOS ----
create policy "equipe le todos os produtos" on public.produtos
  for select to authenticated using (public.eh_equipe());

create policy "admin gerencia produtos" on public.produtos
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

-- ---- CONFIGURAÇÕES ----
create policy "admin gerencia configuracoes" on public.configuracoes
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

-- ---- VENDEDORES ----
create policy "vendedor ve o proprio cadastro" on public.vendedores
  for select to authenticated using (public.eh_admin() or usuario_id = auth.uid());

create policy "admin gerencia vendedores" on public.vendedores
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

-- ---- CLIENTES ----
-- A equipe inteira lê e cadastra cliente (precisa disso para fechar a venda);
-- alterar e excluir continua só com o admin.
create policy "equipe le clientes" on public.clientes
  for select to authenticated using (public.eh_equipe());

create policy "equipe cadastra clientes" on public.clientes
  for insert to authenticated with check (public.eh_equipe());

create policy "admin gerencia clientes" on public.clientes
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

-- ---- PEDIDOS ----
create policy "equipe le pedidos" on public.pedidos
  for select to authenticated using (public.eh_equipe());

create policy "equipe atualiza status do pedido" on public.pedidos
  for update to authenticated using (public.eh_equipe()) with check (public.eh_equipe());

create policy "admin gerencia pedidos" on public.pedidos
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

-- ---- VENDAS ----
-- O vendedor só enxerga o que é dele. Como o filtro está no banco, nem uma
-- consulta montada à mão no navegador consegue ver a venda do colega.
create policy "vendedor le as proprias vendas" on public.vendas
  for select to authenticated
  using (public.eh_admin() or vendedor_id = public.meu_vendedor_id());

create policy "vendedor cria as proprias vendas" on public.vendas
  for insert to authenticated
  with check (public.eh_admin() or vendedor_id = public.meu_vendedor_id());

create policy "vendedor edita as proprias vendas" on public.vendas
  for update to authenticated
  using (public.eh_admin() or vendedor_id = public.meu_vendedor_id())
  with check (public.eh_admin() or vendedor_id = public.meu_vendedor_id());

create policy "admin apaga vendas" on public.vendas
  for delete to authenticated using (public.eh_admin());

-- ---- ITENS DA VENDA ----
-- Seguem a permissão do cabeçalho: se você pode ver a venda, pode ver os itens.
create policy "itens seguem a venda (leitura)" on public.venda_itens
  for select to authenticated
  using (exists (
    select 1 from public.vendas v
     where v.id = venda_id
       and (public.eh_admin() or v.vendedor_id = public.meu_vendedor_id())
  ));

create policy "itens seguem a venda (escrita)" on public.venda_itens
  for insert to authenticated
  with check (exists (
    select 1 from public.vendas v
     where v.id = venda_id
       and (public.eh_admin() or v.vendedor_id = public.meu_vendedor_id())
  ));

create policy "itens seguem a venda (exclusao)" on public.venda_itens
  for delete to authenticated
  using (exists (
    select 1 from public.vendas v
     where v.id = venda_id
       and (public.eh_admin() or v.vendedor_id = public.meu_vendedor_id())
  ));

-- ---------------------------------------------------------------------------
-- 9. STORAGE — fotos dos equipamentos
-- ---------------------------------------------------------------------------
-- ATENCAO ao bloco abaixo: ele esta dentro de um DO com tratamento de erro,
-- e isso NAO e firula.
--
-- O SQL Editor do Supabase roda o script inteiro numa unica transacao. Em
-- alguns projetos a tabela storage.objects pertence a outro dono, e o
-- "create policy" nela falha com "must be owner of table objects". Sem este
-- tratamento, aquele erro la no fim desfaria TUDO que veio antes — as oito
-- tabelas, as funcoes, o RLS — e voce veria um banco vazio sem entender por
-- que.
--
-- Um bloco DO com "exception" cria uma subtransacao: se falhar aqui dentro,
-- so este pedaco volta atras. O resto do schema fica de pe, e a mensagem
-- diz o que fazer na mao.

do $storage$
begin
  insert into storage.buckets (id, name, public)
  values ('produtos', 'produtos', true)
  on conflict (id) do nothing;

  -- drop antes do create para o arquivo poder ser rodado mais de uma vez
  drop policy if exists "fotos de produtos sao publicas" on storage.objects;
  drop policy if exists "admin envia fotos"              on storage.objects;
  drop policy if exists "admin atualiza fotos"           on storage.objects;
  drop policy if exists "admin apaga fotos"              on storage.objects;

  create policy "fotos de produtos sao publicas" on storage.objects
    for select to anon, authenticated using (bucket_id = 'produtos');

  create policy "admin envia fotos" on storage.objects
    for insert to authenticated with check (bucket_id = 'produtos' and public.eh_admin());

  create policy "admin atualiza fotos" on storage.objects
    for update to authenticated using (bucket_id = 'produtos' and public.eh_admin());

  create policy "admin apaga fotos" on storage.objects
    for delete to authenticated using (bucket_id = 'produtos' and public.eh_admin());

  raise notice 'Storage: bucket "produtos" e as 4 policies criados.';

exception
  when insufficient_privilege then
    raise notice 'AVISO: sem permissao para mexer em storage.objects neste projeto. O RESTO DO SCHEMA FOI CRIADO NORMALMENTE. Faca na mao: Storage > New bucket > nome "produtos" > marque Public; depois Storage > produtos > Policies > crie as 4 politicas (leitura para todos; insert, update e delete para authenticated).';
  when others then
    raise notice 'AVISO no trecho de Storage (%): %. O resto do schema foi criado normalmente.', sqlstate, sqlerrm;
end $storage$;
