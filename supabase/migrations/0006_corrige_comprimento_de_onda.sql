-- ===========================================================================
-- 0006 — Corrige o comprimento de onda do laser de diodo
--
-- O que aconteceu: a migracao 0005 classificava a luz intensa pulsada com
--
--     where nome ilike '%pulsada%' or nome ilike '%IPL%'
--
-- e "IPL" aparece dentro de "TRIPLICE". O "Laser de Diodo 808nm Triplice
-- Onda" foi pego por engano e ficou com 400-1200 nm, que e a faixa da luz
-- pulsada, quando o correto e 755 / 808 / 1064.
--
-- Licao: em busca por trecho de texto, o trecho tem que ser delimitado.
-- Aqui a condicao usa a sigla entre parenteses, que e como ela aparece no
-- nome ("Luz Intensa Pulsada (IPL)"), em vez de soltar tres letras no meio
-- de qualquer palavra.
--
-- A 0005 nao foi editada de proposito: ela ja rodou no banco de producao, e
-- mexer numa migracao aplicada faz o historico local deixar de descrever o
-- que de fato aconteceu. Quem rodar tudo do zero passa pela 0005 e chega
-- aqui, terminando com o valor certo do mesmo jeito.
-- ===========================================================================

update public.produtos
   set comprimento_onda = '755 / 808 / 1064'
 where slug = 'laser-de-diodo-808nm-triplice-onda-hp-808-pro';

update public.produtos
   set comprimento_onda = '400-1200'
 where nome ilike '%(IPL)%' or nome ilike '%luz intensa pulsada%';

-- Conferencia
select nome, comprimento_onda
  from public.produtos
 where comprimento_onda is not null
 order by nome;
