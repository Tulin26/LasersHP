-- ===========================================================================
-- 0008 — Acentua o nome que escapou na 0007
--
-- A 0007 atualizou a descricao e as indicacoes deste equipamento, mas nao o
-- nome: ele foi criado na 0005 e la o texto ainda ia sem acento.
-- ===========================================================================

update public.produtos
   set nome = 'Laser Terapêutico de Fotobiomodulação'
 where slug = 'laser-terapeutico-fotobiomodulacao-hp-photo-pro';

select nome from public.produtos order by nome;
