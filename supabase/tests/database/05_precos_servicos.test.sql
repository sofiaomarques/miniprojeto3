-- Testes do preço base e da negociação por serviço (05_precos_servicos.sql).
-- pgTAP. Rodar no Supabase LOCAL:
--   supabase start && supabase test db
-- Tudo roda numa transação com rollback; nada fica no banco.
-- auth.uid() é simulado via request.jwt.claims, como o PostgREST faz.

begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Contas de teste (só existem dentro desta transação)
--   P, Q = prestadoras · A = cliente
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000051', 'a5@teste.local', '{"nome": "Ana"}'),
  ('cccccccc-0000-0000-0000-000000000053', 'p5@teste.local', '{"nome": "Paula"}'),
  ('dddddddd-0000-0000-0000-000000000054', 'q5@teste.local', '{"nome": "Quitéria"}');

update public.perfis set papel = 'cliente'
  where id = 'aaaaaaaa-0000-0000-0000-000000000051';
update public.perfis set papel = 'prestadora'
  where id in ('cccccccc-0000-0000-0000-000000000053', 'dddddddd-0000-0000-0000-000000000054');

-- P faz Elétrica e Encanamento; Q faz Elétrica.
insert into public.servicos_prestadora (prestadora_id, categoria_id)
select v.id::uuid, c.id
from (values
  ('cccccccc-0000-0000-0000-000000000053', 'Elétrica'),
  ('cccccccc-0000-0000-0000-000000000053', 'Encanamento'),
  ('dddddddd-0000-0000-0000-000000000054', 'Elétrica')
) as v (id, categoria)
join public.categorias_servico c on c.nome = v.categoria;

-- ---------------------------------------------------------------------------
-- 1. Estrutura
-- ---------------------------------------------------------------------------
select has_column('public', 'servicos_prestadora', 'preco_base', 'servicos_prestadora tem preco_base');
select col_type_is('public', 'servicos_prestadora', 'preco_base', 'numeric(10,2)', 'preco_base é numeric(10,2)');
select has_column('public', 'servicos_prestadora', 'aceita_negociar', 'servicos_prestadora tem aceita_negociar');
select col_not_null('public', 'servicos_prestadora', 'aceita_negociar', 'aceita_negociar não aceita null');
select is(
  (select count(*)::int from public.servicos_prestadora
    where prestadora_id = 'cccccccc-0000-0000-0000-000000000053'
      and preco_base is null and aceita_negociar = false),
  2,
  'serviço novo nasce sem preço (a combinar) e sem negociação'
);

-- GRANT por coluna: authenticated só atualiza preço e negociação; anon nada.
select ok(
  has_column_privilege('authenticated', 'public.servicos_prestadora', 'preco_base', 'UPDATE')
  and has_column_privilege('authenticated', 'public.servicos_prestadora', 'aceita_negociar', 'UPDATE'),
  'authenticated pode atualizar preco_base e aceita_negociar'
);
select ok(
  not has_column_privilege('authenticated', 'public.servicos_prestadora', 'prestadora_id', 'UPDATE')
  and not has_column_privilege('authenticated', 'public.servicos_prestadora', 'categoria_id', 'UPDATE')
  and not has_column_privilege('authenticated', 'public.servicos_prestadora', 'criado_em', 'UPDATE'),
  'authenticated não atualiza prestadora_id, categoria_id nem criado_em'
);
select ok(
  not has_table_privilege('anon', 'public.servicos_prestadora', 'UPDATE'),
  'anon não atualiza servicos_prestadora'
);

-- ---------------------------------------------------------------------------
-- 2. A dona edita o preço e a negociação de cada serviço
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "cccccccc-0000-0000-0000-000000000053", "role": "authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$ update public.servicos_prestadora set preco_base = 150.50, aceita_negociar = true
     where prestadora_id = 'cccccccc-0000-0000-0000-000000000053'
       and categoria_id = (select id from public.categorias_servico where nome = 'Elétrica') $$,
  'P define preço e negociação da Elétrica'
);
select lives_ok(
  $$ update public.servicos_prestadora set preco_base = 80
     where prestadora_id = 'cccccccc-0000-0000-0000-000000000053'
       and categoria_id = (select id from public.categorias_servico where nome = 'Encanamento') $$,
  'P define o preço do Encanamento, sem negociação'
);
select is(
  (select preco_base from public.servicos_prestadora
    where prestadora_id = 'cccccccc-0000-0000-0000-000000000053'
      and categoria_id = (select id from public.categorias_servico where nome = 'Elétrica')),
  150.50::numeric,
  'preço da Elétrica gravado'
);
select is(
  (select aceita_negociar from public.servicos_prestadora
    where prestadora_id = 'cccccccc-0000-0000-0000-000000000053'
      and categoria_id = (select id from public.categorias_servico where nome = 'Encanamento')),
  false,
  'cada serviço tem a sua negociação'
);
select lives_ok(
  $$ update public.servicos_prestadora set preco_base = null, aceita_negociar = false
     where prestadora_id = 'cccccccc-0000-0000-0000-000000000053'
       and categoria_id = (select id from public.categorias_servico where nome = 'Encanamento') $$,
  'P volta o Encanamento para "a combinar"'
);

-- Faixa do preço (CHECK)
select throws_ok(
  $$ update public.servicos_prestadora set preco_base = 0
     where prestadora_id = 'cccccccc-0000-0000-0000-000000000053' $$,
  '23514', null, 'preço zero é recusado'
);
select throws_ok(
  $$ update public.servicos_prestadora set preco_base = -10
     where prestadora_id = 'cccccccc-0000-0000-0000-000000000053' $$,
  '23514', null, 'preço negativo é recusado'
);
select throws_ok(
  $$ update public.servicos_prestadora set preco_base = 100000
     where prestadora_id = 'cccccccc-0000-0000-0000-000000000053' $$,
  '23514', null, 'preço acima de 99.999,99 é recusado'
);

select throws_ok(
  $$ update public.servicos_prestadora set aceita_negociar = null
     where prestadora_id = 'cccccccc-0000-0000-0000-000000000053' $$,
  '23502', null, 'aceita_negociar não aceita null'
);

-- Colunas fora do GRANT
select throws_ok(
  $$ update public.servicos_prestadora set categoria_id = categoria_id
     where prestadora_id = 'cccccccc-0000-0000-0000-000000000053' $$,
  '42501', null, 'P não troca a categoria por update'
);
select throws_ok(
  $$ update public.servicos_prestadora set prestadora_id = 'dddddddd-0000-0000-0000-000000000054'
     where prestadora_id = 'cccccccc-0000-0000-0000-000000000053' $$,
  '42501', null, 'P não passa o serviço para outra prestadora'
);

-- ---------------------------------------------------------------------------
-- 3. Outras contas não mexem no preço da P
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "dddddddd-0000-0000-0000-000000000054", "role": "authenticated"}', true);
select is_empty(
  $$ update public.servicos_prestadora set preco_base = 1, aceita_negociar = false
     where prestadora_id = 'cccccccc-0000-0000-0000-000000000053' returning categoria_id $$,
  'Q não altera o preço da P (RLS esconde a linha)'
);
select isnt_empty(
  $$ update public.servicos_prestadora set preco_base = 200
     where prestadora_id = 'dddddddd-0000-0000-0000-000000000054' returning categoria_id $$,
  'Q altera o próprio preço'
);

select set_config('request.jwt.claims', '{"sub": "aaaaaaaa-0000-0000-0000-000000000051", "role": "authenticated"}', true);
select is_empty(
  $$ update public.servicos_prestadora set preco_base = 1
     where prestadora_id = 'cccccccc-0000-0000-0000-000000000053' returning categoria_id $$,
  'cliente não altera o preço da P'
);

reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$ update public.servicos_prestadora set preco_base = 1 $$,
  '42501', null, 'anon não altera preço'
);
select is(
  (select preco_base from public.servicos_prestadora
    where prestadora_id = 'cccccccc-0000-0000-0000-000000000053'
      and categoria_id = (select id from public.categorias_servico where nome = 'Elétrica')),
  150.50::numeric,
  'anon lê o preço (a lista de serviços é pública)'
);

-- ---------------------------------------------------------------------------
-- 4. Tirar o serviço leva o preço junto
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '{"sub": "cccccccc-0000-0000-0000-000000000053", "role": "authenticated"}', true);
set local role authenticated;
delete from public.servicos_prestadora
  where prestadora_id = 'cccccccc-0000-0000-0000-000000000053'
    and categoria_id = (select id from public.categorias_servico where nome = 'Elétrica');
insert into public.servicos_prestadora (prestadora_id, categoria_id)
  select 'cccccccc-0000-0000-0000-000000000053', id from public.categorias_servico where nome = 'Elétrica';
select is(
  (select preco_base from public.servicos_prestadora
    where prestadora_id = 'cccccccc-0000-0000-0000-000000000053'
      and categoria_id = (select id from public.categorias_servico where nome = 'Elétrica')),
  null::numeric,
  'serviço removido e marcado de novo volta sem preço'
);

reset role;
select * from finish();
rollback;
