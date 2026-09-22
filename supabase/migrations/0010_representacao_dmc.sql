-- ===========================================================================
-- LaserHP — linha DMC (frente de saúde)
-- Rode este arquivo inteiro em: Supabase > SQL Editor > New query > Run
--
-- OPCIONAL. Cadastra os aparelhos de laserterapia da DMC, que é a frente de
-- saúde do negócio, com as fotos já recortadas em `public/aparelhos/`.
--
-- Por que o caminho da foto começa com "/": esses arquivos são do projeto, e
-- não do Storage. A função urlDaImagem() reconhece as três formas — URL
-- completa, caminho do projeto (com "/") e caminho do Storage (sem prefixo).
--
-- É este cadastro que faz o trilho da home aparecer: ele só entra quando há
-- pelo menos três equipamentos em destaque COM FOTO. Os produtos de
-- demonstração do 0003 não têm imagem, então até aqui a home seguia usando a
-- grade de cards.
--
-- DE ONDE VIERAM OS NÚMEROS
-- Ficha de equipamento de saúde não se chuta. Os três vieram da documentação
-- do fabricante e da distribuidora oficial (Technodontus):
--   Therapy EC — vermelho 660 nm ± 10 nm (InGaAlP) e infravermelho
--                808 nm ± 10 nm (AlGaAs), 100 mW ± 20% cada.
--   E-LIB      — 660 nm ± 10 nm, 100 mW ± 20%. Só vermelho.
--   E-light    — 4 emissores vermelhos (660 nm) + 4 infravermelhos (808 nm).
--
-- O Therapy IA EC ficou DE FORA de propósito, no bloco comentado no fim.
-- Leia o porquê lá antes de habilitá-lo.
--
-- Seguro de rodar duas vezes: `on conflict (slug) do nothing`.
-- ===========================================================================

insert into public.produtos
  (slug, nome, modelo, descricao, indicacoes, area, comprimento_onda,
   preco, preco_sob_consulta, estoque, estoque_minimo, imagens, ativo, destaque)
values
  (
    'therapy-ec-dmc',
    'Therapy EC',
    'DMC',
    'Laser de fotobiomodulação com ponteira alongada, que alcança de áreas superficiais a cavidades profundas. Faz laserpuntura, terapia fotodinâmica (PDT) e ILIB no mesmo aparelho. Emissão de vermelho e infravermelho, separados ou simultâneos, com 100 mW por laser.',
    E'Cicatrização de feridas\nDor e inflamação\nCavidades e áreas profundas\nTécnica ILIB',
    'saude',
    '660 / 808',
    null, true,
    2, 1,
    array['/aparelhos/therapy-ec.png'],
    true, true
  ),
  (
    'e-lib-dmc',
    'E-LIB',
    'DMC',
    'Aparelho de uso direto no pulso, sobre a artéria radial, dedicado à técnica ILIB. Tem sensor de contato que só emite com o equipamento bem posicionado, e é controlado pelo celular por Bluetooth. Pode ser usado junto com o Therapy, liberando o profissional durante a sessão.',
    E'Técnica ILIB\nUso direto no pulso\nControle pelo celular\nComplemento do Therapy',
    'saude',
    '660',
    null, true,
    2, 1,
    array['/aparelhos/e-lib.png'],
    true, true
  ),
  (
    'e-light-cluster-dmc',
    'E-light Cluster',
    'DMC',
    'Cabeça cluster com oito emissores — quatro lasers vermelhos e quatro infravermelhos — para cobrir áreas maiores em menos tempo de atendimento.',
    E'Áreas maiores\nFisioterapia\nEnfermagem\nTerapia capilar',
    'saude',
    '660 / 808',
    null, true,
    2, 1,
    array['/aparelhos/e-light-cluster.png'],
    true, true
  )
on conflict (slug) do nothing;


-- ---------------------------------------------------------------------------
-- Therapy IA EC — habilite só depois de conferir
-- ---------------------------------------------------------------------------
-- O recorte dele já está em `public/aparelhos/therapy-ia-ec.png`, pronto.
--
-- O que trava: a DMC publica a potência dele (Laser Vermelho 100 mW e Laser
-- Infravermelho 100 mW) mas NÃO publica o comprimento de onda. Procurei na
-- página do fabricante e em duas distribuidoras.
--
-- E aqui um detalhe deste projeto: neste schema, `comprimento_onda` nulo não
-- quer dizer "não sei" — quer dizer "não é luz", e a ficha técnica do site
-- escreve com todas as letras que o efeito vem de outro princípio físico.
-- Num laser isso seria falso. Ou seja, não dá para cadastrar com nulo nem
-- inventar o número.
--
-- O valor abaixo ('660 / 808') é uma INFERÊNCIA: é o par usado em toda a
-- linha Therapy da DMC. Provavelmente está certo — mas confira na ficha
-- impressa do aparelho antes de publicar, e só então tire os comentários.
--
-- insert into public.produtos
--   (slug, nome, modelo, descricao, indicacoes, area, comprimento_onda,
--    preco, preco_sob_consulta, estoque, estoque_minimo, imagens, ativo, destaque)
-- values
--   (
--     'therapy-ia-ec-dmc',
--     'Therapy IA EC',
--     'DMC',
--     'Laser de fotobiomodulação guiado por inteligência artificial: o profissional escolhe a condição clínica no aplicativo e o aparelho monta o protocolo. Vermelho e infravermelho, 100 mW cada, juntos ou separados.',
--     E'Protocolos automatizados por condição clínica\nBusca por patologia no aplicativo\nBaseado em publicações científicas',
--     'saude',
--     '660 / 808',   -- <<< INFERIDO. Confira antes de publicar.
--     null, true,
--     2, 1,
--     array['/aparelhos/therapy-ia-ec.png'],
--     true, true
--   )
-- on conflict (slug) do nothing;
