-- ===========================================================================
-- LaserHP — mais aparelhos da linha DMC no trilho da home
-- Rode este arquivo inteiro em: Supabase > SQL Editor > New query > Run
--
-- OPCIONAL, e depende do 0010. Soma dois aparelhos ao trilho de destaques,
-- com as fotos já recortadas em `public/aparelhos/` na mesma tela de
-- 1000 × 1500 dos outros (aparelho centrado, apoiado na base).
--
-- Com três aparelhos o trilho mostrava o mesmo equipamento duas vezes ao
-- mesmo tempo — um recuando à esquerda e outro entrando pela direita. Com
-- cinco, cada posição da tela tem um aparelho diferente.
--
-- DE ONDE VIERAM OS NÚMEROS (página de cada produto em dmcgroup.com.br)
--   Photon Lase — vermelho 660 nm ± 10 nm e infravermelho 808 nm ± 10 nm,
--                 100 mW ± 20% cada, ajustável de 30 a 100 mW.
--                 Registro ANVISA 8003081016.
--   TheraBlu    — laser azul de 450 nm, alta potência para corte e
--                 coagulação de tecidos moles.
--
-- FICARAM DE FORA
--   Thera Lase HOF (1200 nm) — a DMC só vende para credenciados no método
--     Laser Regenera, e a única foto publicada tem uma modelo e o selo da
--     ANVISA por cima do aparelho: não dá recorte limpo.
--   Therapy IA EC — continua comentado no fim do 0010. A página de campanha
--     da DMC publica as potências, mas ainda não publica o comprimento de onda.
--
-- Seguro de rodar duas vezes: `on conflict (slug) do nothing`.
-- ===========================================================================

insert into public.produtos
  (slug, nome, modelo, descricao, indicacoes, area, comprimento_onda,
   preco, preco_sob_consulta, estoque, estoque_minimo, imagens, ativo, destaque)
values
  (
    'photon-lase-dmc',
    'Photon Lase',
    'DMC',
    'Console de fotobiomodulação com tela touchscreen e peça de mão cabeada de ponta alongada. Laser vermelho e infravermelho ajustáveis de 30 a 100 mW, em emissão contínua ou pulsada, separados ou simultâneos. Para quem já domina a técnica e quer montar os próprios protocolos — ou usar os assistidos.',
    E'Fotobiomodulação\nTécnica ILIB\nTerapia fotodinâmica (aPDT)\nLaserpuntura',
    'saude',
    '660 / 808',
    null, true,
    2, 1,
    array['/aparelhos/photon-lase.png'],
    true, true
  ),
  (
    'therablu-dmc',
    'TheraBlu',
    'DMC',
    'Laser cirúrgico azul de 450 nm para corte e coagulação simultâneos em tecidos moles. Alta potência para cirurgia e baixa potência para fotobiomodulação no mesmo equipamento, com interface de toque.',
    E'Cirurgia de tecidos moles\nFrenectomia e gengivoplastia\nRemoção de lesões cutâneas',
    'saude',
    '450',
    null, true,
    2, 1,
    array['/aparelhos/therablu.png'],
    true, true
  )
on conflict (slug) do nothing;
