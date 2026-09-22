-- ===========================================================================
-- 0009 — Contato de verdade e o segundo perfil do Instagram
--
-- Ate aqui o site usava dados de demonstracao no contato. Agora entram os
-- reais, confirmados pelo dono do projeto:
--
--   WhatsApp   (17) 99623-4572 — Dr. Laserterapia (Arthur), representante
--              de vendas DMC. E para este numero que as encomendas devem ir.
--   Instagram  @dr.laserterapia e @laserhelp_oficial
--
-- O @laserhp que estava gravado era um exemplo meu e podia nem existir; um
-- link de rodape apontando para um perfil inexistente e pior que nenhum.
--
-- A tabela so tinha um campo de Instagram e o negocio tem dois perfis, entao
-- entra uma coluna nova em vez de espremer os dois numa string separada por
-- virgula — que teria que ser quebrada no codigo e quebraria de novo no dia
-- em que alguem digitasse ponto e virgula.
-- ===========================================================================

alter table public.configuracoes
  add column if not exists instagram_secundario text;

comment on column public.configuracoes.instagram is
  'Perfil principal do Instagram, com ou sem @.';
comment on column public.configuracoes.instagram_secundario is
  'Segundo perfil, opcional. O negocio atua com dois: o de vendas e o de conteudo/cursos.';

-- A migracao 0004 tirou o acesso amplo de anon a produtos, mas configuracoes
-- continua com leitura publica por policy. Coluna nova herda essa permissao,
-- entao nao ha grant a fazer aqui.

update public.configuracoes
   set whatsapp = '5517996234572',
       instagram = '@dr.laserterapia',
       instagram_secundario = '@laserhelp_oficial',

       texto_sobre =
         'A LaserHP trabalha com equipamentos de laser para duas frentes que '
         || 'costumam ser atendidas por empresas diferentes: a estética, com '
         || 'depilação, rejuvenescimento e tratamento de manchas; e a saúde, '
         || 'com laserterapia, fotobiomodulação, cicatrização de feridas e '
         || E'ILIB.\n\n'
         || 'Somos representantes de vendas da DMC, fabricante brasileira de '
         || 'equipamentos de laser para as áreas de saúde e estética. Isso '
         || 'significa linha completa, documentação em ordem e assistência '
         || E'técnica de fábrica.\n\n'
         || 'Na prática, você conversa com alguém que entende de comprimento '
         || 'de onda, potência e protocolo de aplicação — e não apenas de '
         || 'preço. Antes da compra ajudamos a escolher o aparelho certo para '
         || 'o seu atendimento; depois dela, o suporte continua com a mesma '
         || 'pessoa.'
 where id = 1;

-- ---------------------------------------------------------------------------
-- CONFERENCIA
-- ---------------------------------------------------------------------------
select whatsapp, instagram, instagram_secundario, cidade
  from public.configuracoes
 where id = 1;
