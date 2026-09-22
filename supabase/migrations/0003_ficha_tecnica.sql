-- ===========================================================================
-- LaserHP — ficha técnica do equipamento
-- Rode este arquivo inteiro em: Supabase > SQL Editor > New query > Run
--
-- Por que existe: o herói da vitrine mostra, ao lado do aparelho, a ficha que
-- o profissional compara antes de comprar. Até aqui `produtos` só tinha nome,
-- modelo e texto livre — nada que desse para alinhar em coluna e confrontar
-- um modelo com o outro.
--
-- Os eixos que de fato separam um aparelho do outro na linha DMC:
--   * como ele encosta no paciente  -> aplicacao        ("Caneta", "Cluster", "Pulso")
--   * que luz ele emite             -> dois booleanos, um por cor
--   * em que frequência             -> comprimento_onda ("660 nm e 808 nm")
--   * quanta potência entrega       -> potencia         ("100 mW", "8 x 100 mW")
--
-- Os booleanos e o comprimento de onda não dizem a mesma coisa. Os booleanos
-- acendem os pontinhos coloridos da ficha — vermelho é a luz que se enxerga,
-- azul marca o infravermelho, que o olho não vê. O comprimento de onda é o
-- número que o profissional confronta entre um aparelho e outro.
--
-- Potência e comprimento de onda são TEXTO, não número: a ficha do fabricante
-- vem com unidade e às vezes com soma ("8 x 100 mW") ou com dois valores
-- ("660 nm e 808 nm"). Guardar 100 num numeric obrigaria a inventar a unidade
-- na hora de exibir, e perderia o "8 x".
--
-- Rodar este arquivo duas vezes não faz mal: `if not exists` em cada coluna.
-- ===========================================================================

alter table public.produtos
  add column if not exists aplicacao            text,
  add column if not exists potencia             text,
  add column if not exists comprimento_onda     text,
  add column if not exists emite_vermelho       boolean not null default false,
  add column if not exists emite_infravermelho  boolean not null default false;

comment on column public.produtos.aplicacao is
  'Como o aparelho é aplicado: Caneta, Cluster, Pulso. Texto curto, aparece na ficha da vitrine.';
comment on column public.produtos.potencia is
  'Potência com unidade, como vem na ficha do fabricante. Ex.: "100 mW" ou "8 x 100 mW".';
comment on column public.produtos.comprimento_onda is
  'Comprimento de onda com unidade. Ex.: "660 nm" ou "660 nm e 808 nm".';
comment on column public.produtos.emite_vermelho is
  'Laser vermelho (visível). Acende o ponto vermelho na ficha da vitrine.';
comment on column public.produtos.emite_infravermelho is
  'Laser infravermelho (invisível). Acende o ponto azul na ficha da vitrine.';

-- As policies de RLS de `produtos` já valem para colunas novas: elas liberam
-- a LINHA inteira, não coluna por coluna. Nada a fazer aqui.
-- O gatilho t_produtos (atualizado_em) também continua valendo.
