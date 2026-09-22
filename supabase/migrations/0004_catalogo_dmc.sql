-- ===========================================================================
-- LaserHP — catálogo inicial (linha DMC / Laser Technodontus)
-- Rode este arquivo inteiro em: Supabase > SQL Editor > New query > Run
--
-- Cadastra os quatro aparelhos que aparecem no herói da home. As fotos são os
-- recortes em `public/aparelhos/`, tirados das artes oficiais da DMC: por isso
-- o caminho começa com "/" em vez de ser um arquivo do Storage. A função
-- urlDaImagem() reconhece as duas formas.
--
-- DE ONDE VIERAM OS NÚMEROS
-- Ficha técnica de equipamento de saúde não se chuta. Cada valor abaixo saiu
-- da documentação do fabricante ou da distribuidora oficial:
--
--   Therapy EC   — Technodontus (distribuidora oficial DMC):
--                  vermelho 660 nm ± 10 nm (InGaAlP), infravermelho
--                  808 nm ± 10 nm (AlGaAs), 100 mW ± 20% cada.
--   E-LIB        — Technodontus: 660 nm ± 10 nm, 100 mW ± 20%. Só vermelho.
--   E-light      — DMC/CLSP: 4 emissores vermelhos (660 nm) + 4 infravermelhos
--                  (808 nm), 100 mW ± 20% cada, 8 no total.
--   Therapy IA EC — DMC: Laser Vermelho 100 mW e Laser Infravermelho 100 mW.
--                  O COMPRIMENTO DE ONDA NÃO É PUBLICADO por eles, então fica
--                  NULL aqui. A linha some da vitrine sozinha. Preencha no
--                  painel quando tiver a ficha impressa do aparelho em mãos —
--                  não copie do Therapy EC por semelhança.
--
-- Os valores estão no nominal ("100 mW"), sem a tolerância, que é como se
-- compara aparelho na hora da venda. Confira tudo no painel antes de publicar.
--
-- `on conflict (slug) do nothing` deixa o arquivo seguro de rodar duas vezes:
-- se o equipamento já existe, nada é sobrescrito.
-- ===========================================================================

insert into public.produtos
  (slug, nome, modelo, descricao, indicacoes, aplicacao, potencia,
   comprimento_onda, emite_vermelho, emite_infravermelho, preco,
   preco_sob_consulta, estoque, estoque_minimo, imagens, ativo, destaque)
values
  (
    'therapy-ia-ec',
    'Therapy IA EC',
    'DMC',
    'Laser de fotobiomodulação guiado por inteligência artificial: o profissional escolhe a condição clínica no aplicativo e o aparelho monta o protocolo. Irradia vermelho e infravermelho, juntos ou separados.',
    E'Protocolos automatizados por condição clínica\nBusca por patologia no aplicativo\nBaseado em publicações científicas',
    'Caneta',
    '100 mW por laser',
    null,   -- a DMC não publica o comprimento de onda deste modelo
    true,
    true,
    null, true,
    0, 1,
    array['/aparelhos/therapy-ia-ec.png'],
    true, true
  ),
  (
    'therapy-ec',
    'Therapy EC',
    'DMC',
    'O mais completo para começar: ponteira alongada que alcança qualquer região, de áreas superficiais a cavidades profundas. Faz laserpuntura, terapia fotodinâmica (PDT) e ILIB no mesmo aparelho.',
    E'Áreas superficiais e profundas\nCavidades\nLaserpuntura e PDT\nTécnica ILIB',
    'Caneta',
    '100 mW por laser',
    '660 nm e 808 nm',
    true,
    true,
    null, true,
    0, 1,
    array['/aparelhos/therapy-ec.png'],
    true, true
  ),
  (
    'e-lib',
    'E-LIB',
    'DMC',
    'Aparelho de uso direto no pulso, sobre a artéria radial, dedicado à técnica ILIB. Tem sensor de contato que só emite com o equipamento bem posicionado, e é controlado pelo celular por Bluetooth. Pode ser usado junto com o Therapy.',
    E'Exclusivo para técnica ILIB\nUso direto no pulso\nControle pelo celular\nComplemento do Therapy',
    'Pulso',
    '100 mW',
    '660 nm',
    true,
    false,  -- só laser vermelho, conforme a ficha do fabricante
    null, true,
    0, 1,
    array['/aparelhos/e-lib.png'],
    true, true
  ),
  (
    'e-light-cluster',
    'E-light',
    'Cluster',
    'Cabeça cluster com oito emissores — quatro lasers vermelhos e quatro infravermelhos — para cobrir áreas maiores em menos tempo de atendimento.',
    E'Áreas maiores\nFisioterapia\nEnfermagem\nTerapia capilar',
    'Cluster',
    '8 x 100 mW',
    '660 nm e 808 nm',
    true,
    true,
    null, true,
    0, 1,
    array['/aparelhos/e-light-cluster.png'],
    true, true
  )
on conflict (slug) do nothing;
