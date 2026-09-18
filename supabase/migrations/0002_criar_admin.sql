-- ===========================================================================
-- Contas de acesso ao painel
--
-- Os usuários são criados em: Supabase > Authentication > Users > Add user
-- (marque "Auto Confirm User" para não depender de e-mail de confirmação).
-- Depois rode os blocos abaixo trocando os e-mails.
--
-- Sem uma linha em "perfis" o login funciona, mas o painel fica vazio:
-- eh_admin()/eh_equipe() devolvem false e o RLS bloqueia todas as tabelas.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. ADMIN (seu primo / você)
-- ---------------------------------------------------------------------------
insert into public.perfis (id, nome, papel)
select id, 'Administrador', 'admin'
  from auth.users
 where email = 'troque@pelo-seu-email.com'
on conflict (id) do update set papel = 'admin';

-- ---------------------------------------------------------------------------
-- 2. VENDEDOR COM LOGIN
-- Dois passos: criar o perfil com papel 'vendedor' e ligar o cadastro da
-- tabela vendedores a esse usuário. É o usuario_id que faz meu_vendedor_id()
-- funcionar — sem ele, o vendedor loga mas não enxerga nenhuma venda.
-- ---------------------------------------------------------------------------
insert into public.perfis (id, nome, papel)
select id, 'Nome do Vendedor', 'vendedor'
  from auth.users
 where email = 'vendedor@exemplo.com'
on conflict (id) do update set papel = 'vendedor';

insert into public.vendedores (usuario_id, nome, email)
select u.id, 'Nome do Vendedor', u.email
  from auth.users u
 where u.email = 'vendedor@exemplo.com'
on conflict (usuario_id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. CONFERÊNCIA
-- ---------------------------------------------------------------------------
select u.email, p.papel, v.id as vendedor_id, v.nome
  from auth.users u
  left join public.perfis p     on p.id = u.id
  left join public.vendedores v on v.usuario_id = u.id
 order by u.created_at;
