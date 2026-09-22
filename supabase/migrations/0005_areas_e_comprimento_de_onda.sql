-- ===========================================================================
-- 0005 — Duas frentes de atuacao e comprimento de onda
--
-- O negocio atende dois publicos que compram coisas diferentes:
--
--   estetica — clinica de estetica, esteticista. Depilacao, rejuvenescimento,
--              gordura localizada.
--   saude    — enfermeiro, fisioterapeuta, dentista. Laserterapia,
--              fotobiomodulacao, cicatrizacao de feridas, dor, ILIB.
--
-- Alguns equipamentos servem aos dois (o CO2 fracionado trata cicatriz na
-- estetica e ferida complexa na saude), por isso existe o valor "ambas".
--
-- O comprimento de onda entra porque e o dado que define o que um laser faz.
-- Na vitrine ele vira elemento visual: como ainda nao ha fotos dos aparelhos,
-- cada card mostra a faixa do espectro correspondente ao proprio comprimento
-- de onda. E informacao tecnica real virando identidade, em vez de um icone
-- generico de imagem quebrada.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. ENUM DAS FRENTES
-- ---------------------------------------------------------------------------
do $enum$
begin
  if not exists (select 1 from pg_type where typname = 'area_atuacao') then
    create type public.area_atuacao as enum ('estetica', 'saude', 'ambas');
  end if;
end $enum$;

alter table public.produtos
  add column if not exists area public.area_atuacao not null default 'estetica';

-- Texto livre e nao numero: um aparelho de triplice onda e "755 / 808 / 1064",
-- e a luz pulsada e uma faixa ("400-1200"). Numero nao daria conta.
alter table public.produtos
  add column if not exists comprimento_onda text;

comment on column public.produtos.area is
  'Para qual publico o equipamento e vendido. Usado para separar a vitrine.';
comment on column public.produtos.comprimento_onda is
  'Comprimento de onda em nanometros, como texto: "808", "755 / 808 / 1064", "400-1200". Vazio para o que nao e laser (radiofrequencia, criolipolise).';

create index if not exists produtos_area_idx on public.produtos (area);

-- ---------------------------------------------------------------------------
-- 2. O VISITANTE ANONIMO PRECISA LER AS DUAS COLUNAS NOVAS
--
-- A migracao 0004 tirou o acesso amplo de `anon` a tabela produtos e devolveu
-- coluna por coluna. Coluna criada depois disso nasce sem permissao — sem
-- esta parte, a vitrine quebraria com "permission denied".
-- ---------------------------------------------------------------------------
grant select (area, comprimento_onda) on public.produtos to anon;

-- ---------------------------------------------------------------------------
-- 3. CLASSIFICA O QUE JA EXISTE
-- ---------------------------------------------------------------------------
update public.produtos set area = 'estetica', comprimento_onda = '755 / 808 / 1064'
 where nome ilike '%diodo%';

update public.produtos set area = 'ambas', comprimento_onda = '10600'
 where nome ilike '%CO2%';

update public.produtos set area = 'estetica', comprimento_onda = '400-1200'
 where nome ilike '%pulsada%' or nome ilike '%IPL%';

update public.produtos set area = 'estetica', comprimento_onda = '532 / 1064'
 where nome ilike '%Nd:YAG%' or nome ilike '%YAG%';

-- Radiofrequencia e criolipolise nao sao luz: ficam sem comprimento de onda.
update public.produtos set area = 'estetica', comprimento_onda = null
 where nome ilike '%radiofrequencia%' or nome ilike '%criolipolise%';

update public.produtos set area = 'saude', comprimento_onda = '660 / 808'
 where nome ilike '%baixa potencia%' or nome ilike '%LED%';

-- ---------------------------------------------------------------------------
-- 4. EQUIPAMENTOS DA FRENTE DE SAUDE (DEMONSTRACAO)
--
-- O catalogo so tinha aparelho de estetica, entao a segunda frente ficaria
-- vazia na vitrine. Estes tres sao DADOS DE EXEMPLO, como os da migracao
-- 0003: troque pelos equipamentos reais, ou apague pelo painel.
-- ---------------------------------------------------------------------------
insert into public.produtos
  (slug, nome, modelo, descricao, indicacoes, preco, preco_sob_consulta,
   estoque, estoque_minimo, imagens, ativo, destaque, area, comprimento_onda)
values
  (
    'laser-terapeutico-fotobiomodulacao-hp-photo-pro',
    'Laser Terapeutico de Fotobiomodulacao',
    'HP-Photo Pro',
    'Equipamento de laser de baixa potencia para fotobiomodulacao, com canetas de aplicacao pontual e varredura. Protocolos gravados para dor, inflamacao e reparo tecidual.',
    E'Cicatrizacao de feridas agudas e cronicas\nDor musculoesqueletica\nPos-operatorio\nMucosite oral\nFissura mamaria na amamentacao',
    18900, false, 3, 1, '{}', true, true, 'saude', '660 / 808'
  ),
  (
    'sistema-ilib-endovenoso-hp-ilib',
    'Sistema ILIB Endovenoso',
    'HP-ILIB 660',
    'Conjunto para irradiacao sanguinea por laser (ILIB), com bracadeira de punho e kit de aplicacao. Sessao controlada por tempo, com registro do protocolo.',
    E'Modulacao inflamatoria sistemica\nApoio no tratamento de dor cronica\nFadiga e qualidade do sono\nProtocolos de recuperacao',
    12400, false, 4, 1, '{}', true, false, 'saude', '660'
  ),
  (
    'laser-cirurgico-de-diodo-hp-surgical',
    'Laser Cirurgico de Diodo',
    'HP-Surgical 980',
    'Laser de diodo para pequenos procedimentos cirurgicos e periodontia, com fibras opticas de diferentes diametros e ponteira descartavel.',
    E'Pequenas cirurgias de tecido mole\nPeriodontia e endodontia\nHemostasia\nRemocao de lesoes superficiais',
    null, true, 2, 1, '{}', true, false, 'saude', '980'
  )
on conflict (slug) do update set
  area             = excluded.area,
  comprimento_onda = excluded.comprimento_onda,
  descricao        = excluded.descricao,
  indicacoes       = excluded.indicacoes;

-- ---------------------------------------------------------------------------
-- CONFERENCIA
-- ---------------------------------------------------------------------------
select area,
       count(*) as equipamentos,
       string_agg(nome, ' | ' order by nome) as quais
  from public.produtos
 group by area
 order by area;
