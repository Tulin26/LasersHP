-- ===========================================================================
-- LaserHP — configuracao do negocio + dados de demonstracao
--
-- Rode DEPOIS do 0001_schema_inicial.sql.
-- Este arquivo substitui o 0002_criar_admin.sql para o usuario admin@gmail.com,
-- que ja foi criado em Authentication > Users.
--
-- O arquivo tem duas partes bem separadas:
--   PARTE 1 — configuracao de verdade (WhatsApp, nome, textos do site)
--   PARTE 2 — dados de demonstracao, para voce ver o sistema funcionando
--
-- No fim ha um bloco comentado para apagar SO a demonstracao quando o
-- sistema entrar em uso de verdade.
--
-- Pode rodar mais de uma vez sem duplicar nada.
-- ===========================================================================

do $$
declare
  v_admin   uuid;

  -- produtos
  p_diodo   uuid;
  p_co2     uuid;
  p_ipl     uuid;
  p_yag     uuid;
  p_rf      uuid;
  p_cryo    uuid;
  p_led     uuid;

  -- clientes
  c_bella   uuid;
  c_marina  uuid;
  c_renove  uuid;
  c_camila  uuid;
  c_corpo   uuid;

  -- vendedores
  vd_helena uuid;
  vd_rafael uuid;
  vd_juliana uuid;

  v_venda   uuid;

  -- Datas presas ao mes corrente: o painel resume o mes atual, entao as
  -- vendas precisam cair nele mesmo que voce rode isto no dia 1.
  v_inicio  date := date_trunc('month', current_date)::date;
  d1        date := greatest(v_inicio, current_date - 1);
  d2        date := greatest(v_inicio, current_date - 4);
  d3        date := greatest(v_inicio, current_date - 6);
  d4        date := greatest(v_inicio, current_date - 9);
  d5        date := greatest(v_inicio, current_date - 12);
  d6        date := greatest(v_inicio, current_date - 18);
  d_antes   date := (date_trunc('month', current_date) - interval '1 month')::date + 10;
begin

-- ===========================================================================
-- PARTE 1 — CONFIGURACAO DE VERDADE
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1.1 Acesso ao painel
-- O usuario ja existe em auth.users; aqui so damos o papel de admin.
-- Sem esta linha o login funciona mas o RLS bloqueia a leitura de tudo.
-- ---------------------------------------------------------------------------
select id into v_admin from auth.users where email = 'admin@gmail.com';

if v_admin is null then
  raise exception
    'Usuario admin@gmail.com nao encontrado. Crie em Authentication > Users (marque Auto Confirm User) e rode este arquivo de novo.';
end if;

insert into public.perfis (id, nome, papel)
values (v_admin, 'Administrador', 'admin')
on conflict (id) do update
  set papel = 'admin',
      nome  = 'Administrador';

-- ---------------------------------------------------------------------------
-- 1.2 Dados do negocio e textos do site
-- O WhatsApp fica so com digitos e COM o DDI 55 — e o formato que o link
-- wa.me exige. (17) 99728-5058 vira 5517997285058.
-- ---------------------------------------------------------------------------
update public.configuracoes
   set nome_negocio   = 'LaserHP',
       whatsapp       = '5517997285058',
       email_contato  = 'contato@laserhp.com.br',
       cidade         = 'Sao Jose do Rio Preto - SP',
       instagram      = '@laserhp',
       titulo_home    = 'Equipamentos de laser para estetica',
       subtitulo_home = 'Tecnologia profissional para clinicas e esteticistas, com suporte de quem entende do assunto e entrega para todo o Brasil.',
       texto_sobre    = 'Trabalhamos com equipamentos de laser e tecnologias para estetica, atendendo clinicas e profissionais que precisam de aparelho confiavel e suporte proximo.'
                        || chr(10) || chr(10) ||
                        'Cada equipamento sai daqui com documentacao em dia, treinamento de uso e garantia. Fale com a gente e conte o que voce precisa: indicamos o aparelho certo para o seu atendimento, sem empurrar o mais caro.',
       seo_titulo     = 'LaserHP — Equipamentos de laser para estetica',
       seo_descricao  = 'Venda de equipamentos de laser para estetica: depilacao definitiva, rejuvenescimento, manchas e tatuagens. Atendimento direto pelo WhatsApp.'
 where id = 1;

-- ===========================================================================
-- PARTE 2 — DADOS DE DEMONSTRACAO
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 2.1 Equipamentos
--
-- O estoque abaixo ja e o valor FINAL que voce vai ver na tela: as vendas da
-- secao 2.4 sao lancadas como historico, sem mexer no estoque (o mesmo que a
-- importacao de planilha faz com vendas antigas). Assim os numeros ficam
-- previsiveis em vez de dependerem da ordem de execucao.
--
-- De proposito ha dois casos de alerta:
--   HP-RF Micro -> estoque 1 com minimo 2
--   HP-Cryo 4D  -> estoque 0
-- ---------------------------------------------------------------------------

insert into public.produtos
  (slug, nome, modelo, descricao, indicacoes, preco, preco_sob_consulta, estoque, estoque_minimo, ativo, destaque)
values
  ('laser-de-diodo-808nm-triplice-onda-hp-808-pro',
   'Laser de Diodo 808nm Triplice Onda',
   'HP-808 Pro',
   'Equipamento de depilacao definitiva com tres comprimentos de onda (755nm, 808nm e 1064nm) disparados simultaneamente, o que permite atender do fototipo I ao VI. Ponteira com refrigeracao por safira a -5C, potencia de 1200W e disparo em modo continuo ou pulsado.'
   || chr(10) || 'Acompanha: ponteira grande, oculos de protecao, carrinho e treinamento de uso.',
   'Depilacao definitiva em todos os fototipos' || chr(10) ||
   'Areas extensas como pernas e costas' || chr(10) ||
   'Pelos finos e claros (modo triplice onda)' || chr(10) ||
   'Foliculite e pseudofoliculite da barba',
   46900.00, false, 4, 1, true, true),

  ('laser-fracionado-de-co2-hp-co2-fractional',
   'Laser Fracionado de CO2',
   'HP-CO2 Fractional',
   'Laser ablativo de 10.600nm para resurfacing. Tres modos de trabalho: fracionado, cirurgico e ginecologico. Braco articulado de sete espelhos, potencia regulavel de 1W a 40W e tela sensivel ao toque de 10 polegadas.'
   || chr(10) || 'Acompanha: tres ponteiras, pedal, oculos e kit de manutencao.',
   'Rejuvenescimento facial e resurfacing' || chr(10) ||
   'Cicatrizes de acne e estrias' || chr(10) ||
   'Melasma e manchas senis' || chr(10) ||
   'Remocao de verrugas e pequenas lesoes' || chr(10) ||
   'Rejuvenescimento intimo',
   38500.00, false, 2, 1, true, true),

  ('luz-intensa-pulsada-ipl-hp-ipl-600',
   'Luz Intensa Pulsada (IPL)',
   'HP-IPL 600',
   'Plataforma de luz intensa pulsada com cinco filtros intercambiaveis (480, 530, 560, 590 e 640nm), permitindo tratar desde vasos ate depilacao no mesmo aparelho. Refrigeracao semicondutora e contador de disparos por ponteira.',
   'Depilacao em fototipos claros' || chr(10) ||
   'Vasos e telangiectasias faciais' || chr(10) ||
   'Manchas solares' || chr(10) ||
   'Rosacea e vermelhidao difusa' || chr(10) ||
   'Fotorrejuvenescimento',
   18900.00, false, 6, 2, true, false),

  ('laser-ndyag-q-switched-hp-qs-1064',
   'Laser Nd:YAG Q-Switched',
   'HP-QS 1064',
   'Laser de picossegundo/nanossegundo para remocao de pigmentos. Quatro comprimentos de onda (1064, 532, 585 e 650nm) cobrindo praticamente toda a paleta de tintas de tatuagem. Ponteira de carbon peel inclusa.'
   || chr(10) || 'Valor sob consulta: trabalhamos com versoes de 500mJ e 2000mJ, e o preco muda bastante entre elas.',
   'Remocao de tatuagem colorida e preta' || chr(10) ||
   'Melasma e melanose solar' || chr(10) ||
   'Carbon peel (peeling de diamante negro)' || chr(10) ||
   'Remocao de micropigmentacao e sobrancelha' || chr(10) ||
   'Olheiras pigmentadas',
   null, true, 3, 1, true, true),

  ('radiofrequencia-microagulhada-hp-rf-micro',
   'Radiofrequencia Microagulhada',
   'HP-RF Micro',
   'Radiofrequencia fracionada com microagulhas isoladas em ouro, profundidade regulavel de 0,5mm a 3,5mm. Entrega energia na derme sem queimar a epiderme, o que reduz muito o tempo de recuperacao em relacao ao laser ablativo.',
   'Flacidez facial e do pescoco' || chr(10) ||
   'Cicatrizes de acne' || chr(10) ||
   'Estrias e flacidez corporal' || chr(10) ||
   'Poros dilatados' || chr(10) ||
   'Hiperidrose axilar',
   24700.00, false, 1, 2, true, false),

  ('criolipolise-4-manoplas-hp-cryo-4d',
   'Criolipolise 4 Manoplas',
   'HP-Cryo 4D',
   'Criolipolise com quatro manoplas independentes, permitindo tratar quatro areas na mesma sessao. Temperatura de -11C a +5C, controle individual de vacuo e tela de 15 polegadas. Manoplas de tamanhos diferentes para flanco, abdomen e submento.',
   'Gordura localizada no abdomen e flancos' || chr(10) ||
   'Papada (submento)' || chr(10) ||
   'Culote e face interna das coxas' || chr(10) ||
   'Gordura nas costas e bracos',
   32000.00, false, 0, 1, true, false),

  ('laser-de-baixa-potencia-led-hp-led-therapy',
   'Laser de Baixa Potencia / LED',
   'HP-LED Therapy',
   'Painel de fotobiomodulacao com 1200 LEDs em quatro cores (vermelho 630nm, azul 415nm, ambar 590nm e infravermelho 830nm). Usado sozinho ou como complemento pos-procedimento para acelerar a recuperacao.',
   'Acne inflamatoria (luz azul)' || chr(10) ||
   'Cicatrizacao pos-laser e pos-peeling' || chr(10) ||
   'Rejuvenescimento suave sem downtime' || chr(10) ||
   'Queda capilar' || chr(10) ||
   'Dor e inflamacao muscular',
   7900.00, false, 8, 2, true, false)

on conflict (slug) do update
  set nome               = excluded.nome,
      modelo             = excluded.modelo,
      descricao          = excluded.descricao,
      indicacoes         = excluded.indicacoes,
      preco              = excluded.preco,
      preco_sob_consulta = excluded.preco_sob_consulta,
      estoque            = excluded.estoque,
      estoque_minimo     = excluded.estoque_minimo,
      ativo              = excluded.ativo,
      destaque           = excluded.destaque;

-- Recupera os ids para usar nas vendas.
select id into p_diodo from public.produtos where slug = 'laser-de-diodo-808nm-triplice-onda-hp-808-pro';
select id into p_co2   from public.produtos where slug = 'laser-fracionado-de-co2-hp-co2-fractional';
select id into p_ipl   from public.produtos where slug = 'luz-intensa-pulsada-ipl-hp-ipl-600';
select id into p_yag   from public.produtos where slug = 'laser-ndyag-q-switched-hp-qs-1064';
select id into p_rf    from public.produtos where slug = 'radiofrequencia-microagulhada-hp-rf-micro';
select id into p_cryo  from public.produtos where slug = 'criolipolise-4-manoplas-hp-cryo-4d';
select id into p_led   from public.produtos where slug = 'laser-de-baixa-potencia-led-hp-led-therapy';

-- ---------------------------------------------------------------------------
-- 2.2 Vendedores
-- ---------------------------------------------------------------------------
insert into public.vendedores (nome, telefone, email, ativo, observacoes)
select 'Helena Prado', '17997285058', 'helena@laserhp.com.br', true, 'Atende a regiao de Rio Preto e Aracatuba.'
where not exists (select 1 from public.vendedores where nome = 'Helena Prado');

insert into public.vendedores (nome, telefone, email, ativo, observacoes)
select 'Rafael Moura', '17998112233', 'rafael@laserhp.com.br', true, 'Atende Ribeirao Preto e Franca.'
where not exists (select 1 from public.vendedores where nome = 'Rafael Moura');

insert into public.vendedores (nome, telefone, email, ativo, observacoes)
select 'Juliana Castro', '17996554477', 'juliana@laserhp.com.br', true, 'Atende Bauru, Marilia e interior.'
where not exists (select 1 from public.vendedores where nome = 'Juliana Castro');

select id into vd_helena  from public.vendedores where nome = 'Helena Prado';
select id into vd_rafael  from public.vendedores where nome = 'Rafael Moura';
select id into vd_juliana from public.vendedores where nome = 'Juliana Castro';

-- ---------------------------------------------------------------------------
-- 2.3 Clientes
-- Documento so com digitos, que e como a aplicacao grava.
-- ---------------------------------------------------------------------------
insert into public.clientes (nome, telefone, email, documento, cidade, observacoes)
values
  ('Clinica Bella Pele',      '17993441122', 'contato@bellapele.com.br',  '34871290000158', 'Sao Jose do Rio Preto - SP', 'Cliente recorrente. Compra sempre no inicio do semestre.'),
  ('Dra. Marina Albuquerque', '16991887744', 'marina.alb@gmail.com',      '41528963077',    'Ribeirao Preto - SP',        'Dermatologista. Prefere atendimento por e-mail.'),
  ('Espaco Renove Estetica',  '18997663311', 'renove@espacorenove.com',   '29740155000193', 'Aracatuba - SP',             'Abriu a segunda unidade em marco.'),
  ('Camila Ferreira',         '17998220099', 'camila.ferreira@gmail.com', '30822417066',    'Catanduva - SP',             'Esteticista autonoma. Veio pelo Instagram.'),
  ('Instituto Corpo & Forma', '14996337788', 'compras@corpoeforma.com.br','51903627000144', 'Bauru - SP',                 'Rede com tres unidades. Compra com nota e prazo.')
-- O indice unico de documento e PARCIAL (where documento is not null).
-- Nesse caso o Postgres so consegue inferir o indice se o mesmo predicado
-- aparecer aqui. Sem o "where", o comando falha com
-- "there is no unique or exclusion constraint matching the ON CONFLICT".
on conflict (documento) where documento is not null do update
  set nome     = excluded.nome,
      telefone = excluded.telefone,
      email    = excluded.email,
      cidade   = excluded.cidade;

select id into c_bella  from public.clientes where documento = '34871290000158';
select id into c_marina from public.clientes where documento = '41528963077';
select id into c_renove from public.clientes where documento = '29740155000193';
select id into c_camila from public.clientes where documento = '30822417066';
select id into c_corpo  from public.clientes where documento = '51903627000144';

-- ---------------------------------------------------------------------------
-- 2.4 Vendas
--
-- Ordem obrigatoria: cabecalho -> itens -> desconto.
-- O desconto entra por ultimo porque a trava "subtotal - desconto >= 0" so
-- pode ser avaliada depois que os itens existirem e o gatilho tiver calculado
-- o subtotal. E a mesma ordem que a funcao registrar_venda usa.
--
-- O `if not exists` evita duplicar tudo se voce rodar o arquivo de novo.
-- ---------------------------------------------------------------------------
if not exists (select 1 from public.vendas) then

  -- (1) Clinica Bella Pele — dois equipamentos, com desconto, pago
  insert into public.vendas (data, cliente_id, vendedor_id, forma_pagamento, status, observacoes, criado_por)
  values (d1, c_bella, vd_helena, 'pix', 'pago', 'Levou o LED junto como cortesia de negociacao. Entrega agendada.', v_admin)
  returning id into v_venda;
  insert into public.venda_itens (venda_id, produto_id, quantidade, valor_unitario) values
    (v_venda, p_diodo, 1, 46900.00),
    (v_venda, p_led,   1,  7900.00);
  update public.vendas set desconto = 2800.00 where id = v_venda;

  -- (2) Dra. Marina — venda simples, cartao, pago
  insert into public.vendas (data, cliente_id, vendedor_id, forma_pagamento, status, observacoes, criado_por)
  values (d2, c_marina, vd_rafael, 'cartao_credito', 'pago', 'Parcelado em 10x sem juros.', v_admin)
  returning id into v_venda;
  insert into public.venda_itens (venda_id, produto_id, quantidade, valor_unitario) values
    (v_venda, p_co2, 1, 38500.00);

  -- (3) Venda cancelada — aparece no historico com o valor riscado e NAO
  --     entra em nenhum total do painel.
  insert into public.vendas (data, cliente_id, vendedor_id, forma_pagamento, status, observacoes, criado_por)
  values (d3, c_camila, vd_helena, 'boleto', 'cancelado', 'Cliente desistiu: vai comprar no proximo semestre.', v_admin)
  returning id into v_venda;
  insert into public.venda_itens (venda_id, produto_id, quantidade, valor_unitario) values
    (v_venda, p_led, 1, 7900.00);

  -- (4) Espaco Renove — duas unidades do mesmo item, pendente
  insert into public.vendas (data, cliente_id, vendedor_id, forma_pagamento, status, observacoes, criado_por)
  values (d4, c_renove, vd_juliana, 'transferencia', 'pendente', 'Uma unidade para cada loja. Aguardando o pagamento da segunda parcela.', v_admin)
  returning id into v_venda;
  insert into public.venda_itens (venda_id, produto_id, quantidade, valor_unitario) values
    (v_venda, p_ipl, 2, 18900.00);
  update public.vendas set desconto = 1800.00 where id = v_venda;

  -- (5) Camila Ferreira — pendente
  insert into public.vendas (data, cliente_id, vendedor_id, forma_pagamento, status, observacoes, criado_por)
  values (d5, c_camila, vd_helena, 'boleto', 'pendente', 'Primeiro boleto vence dia 10.', v_admin)
  returning id into v_venda;
  insert into public.venda_itens (venda_id, produto_id, quantidade, valor_unitario) values
    (v_venda, p_rf, 1, 24700.00);

  -- (6) Instituto Corpo & Forma — maior venda do mes
  insert into public.vendas (data, cliente_id, vendedor_id, forma_pagamento, status, observacoes, criado_por)
  values (d6, c_corpo, vd_rafael, 'financiamento', 'pago', 'Financiamento aprovado em 24x. Nota emitida.', v_admin)
  returning id into v_venda;
  insert into public.venda_itens (venda_id, produto_id, quantidade, valor_unitario) values
    (v_venda, p_cryo, 1, 32000.00),
    (v_venda, p_led,  1,  7900.00);
  update public.vendas set desconto = 900.00 where id = v_venda;

  -- (7) Mes anterior — serve para o carrossel mostrar historico fora do mes
  insert into public.vendas (data, cliente_id, vendedor_id, forma_pagamento, status, observacoes, criado_por)
  values (d_antes, c_bella, vd_juliana, 'pix', 'pago', 'Venda do mes passado.', v_admin)
  returning id into v_venda;
  insert into public.venda_itens (venda_id, produto_id, quantidade, valor_unitario) values
    (v_venda, p_yag, 1, 28000.00);

end if;

-- ---------------------------------------------------------------------------
-- 2.5 Pedidos vindos do site
-- Simulam o que o formulario da vitrine grava. Um novo, um em contato.
-- ---------------------------------------------------------------------------
if not exists (select 1 from public.pedidos) then

  insert into public.pedidos (produto_id, nome, telefone, email, cidade, mensagem, status)
  values
    (p_diodo, 'Patricia Nogueira', '17991445566', 'patricia.nog@gmail.com', 'Mirassol - SP',
     'Boa tarde! Tenho uma clinica pequena e queria saber o valor do diodo 808 e se voces parcelam. Atendo uns 40 clientes por mes.', 'novo'),

    (p_co2, 'Studio Derma Vita', '17993887711', 'contato@dermavita.com.br', 'Sao Jose do Rio Preto - SP',
     'Gostaria de agendar uma demonstracao do CO2 fracionado na minha clinica.', 'novo'),

    (p_yag, 'Bruno Tavares', '16998774422', null, 'Ribeirao Preto - SP',
     'Trabalho com remocao de tatuagem e queria o orcamento do Q-Switched na versao de 2000mJ.', 'em_contato');

end if;

raise notice 'Pronto! Admin configurado, WhatsApp salvo e dados de demonstracao criados.';

end $$;

-- ===========================================================================
-- CONFERENCIA — rode para ver se ficou tudo certo
-- ===========================================================================
select
  (select count(*) from public.produtos)    as produtos,
  (select count(*) from public.clientes)    as clientes,
  (select count(*) from public.vendedores)  as vendedores,
  (select count(*) from public.vendas)      as vendas,
  (select count(*) from public.pedidos)     as pedidos,
  (select whatsapp from public.configuracoes where id = 1) as whatsapp,
  (select p.papel from public.perfis p join auth.users u on u.id = p.id
    where u.email = 'admin@gmail.com')      as papel_do_admin;

-- ===========================================================================
-- APAGAR SO A DEMONSTRACAO (quando o sistema entrar em uso de verdade)
--
-- Tire o comentario das linhas abaixo e rode. A ordem importa por causa das
-- chaves estrangeiras: itens antes das vendas, vendas antes de clientes.
-- A PARTE 1 (admin e configuracoes) nao e tocada.
-- ===========================================================================
-- delete from public.venda_itens;
-- delete from public.vendas;
-- delete from public.pedidos;
-- delete from public.clientes;
-- delete from public.vendedores;
-- delete from public.produtos;
