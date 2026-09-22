-- ===========================================================================
-- 0007 — Texto da vitrine: acentuacao correta e as duas frentes
--
-- Dois problemas de uma vez.
--
-- 1. ACENTUACAO
--    Todo o conteudo estava sem acento: "Depilacao definitiva", "voce",
--    "estetica". Em codigo isso e uma escolha defensavel (evita problema de
--    codificacao entre Windows, Linux e o terminal). Em TEXTO QUE O CLIENTE
--    LE, nao e: um brasileiro bate o olho em "Depilacao" e registra descuido,
--    mesmo sem saber dizer por que. Numa loja que vende aparelho de quarenta
--    mil reais, descuido custa caro.
--
--    O banco e UTF-8 e os arquivos de migracao tambem, entao o acento vai
--    direto, sem escape.
--
-- 2. POSICIONAMENTO
--    Os textos falavam so de estetica, mas o negocio tambem atende saude
--    (laserterapia, fotobiomodulacao, feridas). A chamada da home ignorava
--    metade do publico.
-- ===========================================================================

update public.configuracoes
   set titulo_home = 'Equipamentos de laser para estética e saúde',

       subtitulo_home =
         'Da depilação definitiva à fotobiomodulação. Atendemos clínicas de '
         || 'estética e profissionais de saúde em todo o Brasil, com suporte '
         || 'de quem conhece o aparelho por dentro.',

       texto_sobre =
         'A LaserHP trabalha com equipamentos de laser para duas frentes que '
         || 'costumam ser atendidas por empresas diferentes: a estética, com '
         || 'depilação, rejuvenescimento e tratamento de manchas; e a saúde, '
         || 'com laserterapia, fotobiomodulação, cicatrização de feridas e '
         || E'ILIB.\n\n'
         || 'Na prática isso significa que você conversa com alguém que '
         || 'entende de comprimento de onda, potência e protocolo de '
         || 'aplicação — e não apenas de preço. Antes da compra ajudamos a '
         || 'escolher o aparelho certo para o seu atendimento; depois dela, '
         || 'o suporte continua com a mesma pessoa.'
 where id = 1;

-- ---------------------------------------------------------------------------
-- Equipamentos: nome, descricao e indicacoes com acento
-- ---------------------------------------------------------------------------
update public.produtos set
  nome = 'Laser de Diodo 808nm Tríplice Onda',
  descricao = 'Equipamento de depilação definitiva com três comprimentos de onda simultâneos (755nm, 808nm e 1064nm), que cobrem todos os fototipos, inclusive pele negra e bronzeada. Ponteira com resfriamento por contato a -5 °C.',
  indicacoes = E'Depilação definitiva em todos os fototipos\nÁreas extensas com sessões rápidas\nPele bronzeada e fototipos altos\nPelos finos e claros'
 where slug = 'laser-de-diodo-808nm-triplice-onda-hp-808-pro';

update public.produtos set
  nome = 'Laser Fracionado de CO₂',
  descricao = 'Laser ablativo de 10.600nm para resurfacing. Três modos de trabalho: fracionado, cirúrgico e ginecológico. Na saúde, também é usado no tratamento de cicatrizes e feridas complexas.',
  indicacoes = E'Rejuvenescimento e textura da pele\nCicatrizes de acne e cirúrgicas\nEstrias e flacidez\nRemoção de lesões superficiais\nTratamento de cicatriz hipertrófica'
 where slug ilike '%co2%';

update public.produtos set
  nome = 'Luz Intensa Pulsada (IPL)',
  descricao = 'Luz pulsada de amplo espectro (400 a 1200nm) com filtros intercambiáveis, para tratar manchas, vasos e vermelhidão em uma mesma plataforma.',
  indicacoes = E'Manchas solares e melasma superficial\nVasos finos e rosácea\nRejuvenescimento sem tempo de recuperação\nAcne inflamatória'
 where nome ilike '%(IPL)%' or nome ilike '%luz intensa pulsada%';

update public.produtos set
  nome = 'Laser Nd:YAG Q-Switched',
  descricao = 'Laser de picossegundo/nanossegundo para remoção de pigmentos. Quatro comprimentos de onda com ponteiras próprias para tatuagem colorida e para melasma.',
  indicacoes = E'Remoção de tatuagem\nMelasma e hiperpigmentação\nOlheiras pigmentadas\nCarbon peel'
 where nome ilike '%YAG%';

update public.produtos set
  nome = 'Radiofrequência Microagulhada',
  descricao = 'Radiofrequência fracionada com microagulhas isoladas, com profundidade e energia reguláveis. Não é luz: o estímulo vem do calor entregue na derme.',
  indicacoes = E'Flacidez facial e corporal\nCicatrizes de acne\nPoros dilatados\nEstrias'
 where nome ilike '%radiofrequ%';

update public.produtos set
  nome = 'Criolipólise 4 Manoplas',
  descricao = 'Aparelho de criolipólise com quatro manoplas simultâneas e controle independente de temperatura e vácuo. Reduz gordura localizada por resfriamento controlado.',
  indicacoes = E'Gordura localizada no abdômen e flancos\nCulote e face interna das coxas\nPapada\nQuatro áreas na mesma sessão'
 where nome ilike '%criolip%';

update public.produtos set
  nome = 'Laser de Baixa Potência / LED',
  descricao = 'Equipamento de fotobiomodulação com canetas de laser vermelho e infravermelho e cluster de LED, para aplicação pontual ou em área.',
  indicacoes = E'Cicatrização de feridas\nDor e processo inflamatório\nPós-operatório\nMucosite oral'
 where nome ilike '%baixa pot%';

update public.produtos set
  descricao = 'Equipamento de laser de baixa potência para fotobiomodulação, com canetas de aplicação pontual e varredura. Protocolos gravados para dor, inflamação e reparo tecidual.',
  indicacoes = E'Cicatrização de feridas agudas e crônicas\nDor musculoesquelética\nPós-operatório\nMucosite oral\nFissura mamária na amamentação'
 where slug = 'laser-terapeutico-fotobiomodulacao-hp-photo-pro';

update public.produtos set
  descricao = 'Conjunto para irradiação sanguínea por laser (ILIB), com braçadeira de punho e kit de aplicação. Sessão controlada por tempo, com registro do protocolo.',
  indicacoes = E'Modulação inflamatória sistêmica\nApoio no tratamento de dor crônica\nFadiga e qualidade do sono\nProtocolos de recuperação'
 where slug = 'sistema-ilib-endovenoso-hp-ilib';

update public.produtos set
  nome = 'Laser Cirúrgico de Diodo',
  descricao = 'Laser de diodo para pequenos procedimentos cirúrgicos e periodontia, com fibras ópticas de diferentes diâmetros e ponteira descartável.',
  indicacoes = E'Pequenas cirurgias de tecido mole\nPeriodontia e endodontia\nHemostasia\nRemoção de lesões superficiais'
 where slug = 'laser-cirurgico-de-diodo-hp-surgical';

-- ---------------------------------------------------------------------------
-- CONFERENCIA
-- ---------------------------------------------------------------------------
select nome, area, comprimento_onda
  from public.produtos
 order by area, nome;
