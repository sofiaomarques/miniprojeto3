-- RLS da identidade com duas contas (#19). pgTAP; roda depois da 01:
--   supabase start && supabase test db
-- Tudo roda numa transação com rollback; nada fica no banco. auth.uid() é
-- simulado via request.jwt.claims, como o PostgREST faz em cada requisição.
--
-- Contas: A = cliente Ana, B = prestadora Bia, C = prestadora Cris.
-- A pergunta de cada bloco: uma conta consegue mexer no que é de outra?
-- Tentativas em linha alheia usam `returning` + is_empty, então falham na
-- hora se a policy deixar passar (e não só na conferência como admin).
-- As contagens são filtradas pelas contas de teste: o teste não depende do
-- banco estar vazio.

begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- ---------------------------------------------------------------------------
-- Preparação (como admin): perfis, um serviço e uma foto da Bia
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'ana@duas.local',  '{"nome": "Ana"}'),
  ('b2b2b2b2-0000-4000-8000-000000000002', 'bia@duas.local',  '{"nome": "Bia"}'),
  ('c3c3c3c3-0000-4000-8000-000000000003', 'cris@duas.local', '{"nome": "Cris"}');
update public.perfis set papel = 'cliente', cidade = 'Recife'
  where id = 'a1a1a1a1-0000-4000-8000-000000000001';
update public.perfis set papel = 'prestadora', cidade = 'João Pessoa', bio = 'Eletricista'
  where id = 'b2b2b2b2-0000-4000-8000-000000000002';
update public.perfis set papel = 'prestadora'
  where id = 'c3c3c3c3-0000-4000-8000-000000000003';

insert into public.servicos_prestadora (prestadora_id, categoria_id)
  values ('b2b2b2b2-0000-4000-8000-000000000002', 1);
insert into public.fotos_portfolio (prestadora_id, caminho)
  values ('b2b2b2b2-0000-4000-8000-000000000002', 'b2b2b2b2-0000-4000-8000-000000000002/trabalho.jpg');
insert into storage.objects (bucket_id, name)
  values ('portfolio', 'b2b2b2b2-0000-4000-8000-000000000002/trabalho.jpg');

-- ---------------------------------------------------------------------------
-- 1. Ana (cliente) tentando mexer no perfil e nas fotos da Bia
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "a1a1a1a1-0000-4000-8000-000000000001", "role": "authenticated"}', true);
set local role authenticated;

select is(
  (select nome from public.perfis where id = 'b2b2b2b2-0000-4000-8000-000000000002'),
  'Bia', 'Ana vê o perfil da Bia (prestadora é pública)'
);
select is_empty(
  $$ update public.perfis set nome = 'hackeado', bio = 'x', cidade = 'x'
     where id = 'b2b2b2b2-0000-4000-8000-000000000002' returning id $$,
  'Ana não edita nome, bio nem cidade da Bia'
);
select is_empty(
  $$ update public.perfis set avatar_url = 'https://exemplo.com/a.png'
     where id = 'b2b2b2b2-0000-4000-8000-000000000002' returning id $$,
  'Ana não troca o avatar da Bia'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('portfolio', 'b2b2b2b2-0000-4000-8000-000000000002/intrusa.jpg') $$,
  '42501', null, 'Ana não sobe arquivo na pasta da Bia'
);
select is_empty(
  $$ delete from storage.objects
     where bucket_id = 'portfolio' and name like 'b2b2b2b2-0000-4000-8000-000000000002/%' returning id $$,
  'Ana não apaga arquivo da pasta da Bia'
);
select throws_ok(
  $$ insert into public.fotos_portfolio (prestadora_id, caminho)
     values ('b2b2b2b2-0000-4000-8000-000000000002', 'b2b2b2b2-0000-4000-8000-000000000002/x.jpg') $$,
  '42501', null, 'Ana não registra foto em nome da Bia'
);
select is_empty(
  $$ delete from public.fotos_portfolio
     where prestadora_id = 'b2b2b2b2-0000-4000-8000-000000000002' returning id $$,
  'Ana não apaga foto da Bia'
);
select is_empty(
  $$ delete from public.servicos_prestadora
     where prestadora_id = 'b2b2b2b2-0000-4000-8000-000000000002' returning categoria_id $$,
  'Ana não apaga serviço da Bia'
);

-- ---------------------------------------------------------------------------
-- 2. Cris (outra prestadora) tentando o mesmo com a Bia
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "c3c3c3c3-0000-4000-8000-000000000003", "role": "authenticated"}', true);

select is_empty(
  $$ update public.perfis set nome = 'hackeado'
     where id = 'b2b2b2b2-0000-4000-8000-000000000002' returning id $$,
  'Cris não edita o perfil da Bia'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('portfolio', 'b2b2b2b2-0000-4000-8000-000000000002/da-cris.jpg') $$,
  '42501', null, 'Cris não sobe arquivo na pasta da Bia'
);
select is_empty(
  $$ delete from storage.objects
     where bucket_id = 'portfolio' and name like 'b2b2b2b2-0000-4000-8000-000000000002/%' returning id $$,
  'Cris não apaga arquivo da pasta da Bia'
);
select throws_ok(
  $$ insert into public.fotos_portfolio (prestadora_id, caminho)
     values ('b2b2b2b2-0000-4000-8000-000000000002', 'b2b2b2b2-0000-4000-8000-000000000002/y.jpg') $$,
  '42501', null, 'Cris não registra foto em nome da Bia'
);
select is_empty(
  $$ delete from public.fotos_portfolio
     where prestadora_id = 'b2b2b2b2-0000-4000-8000-000000000002' returning id $$,
  'Cris não apaga foto da Bia'
);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('portfolio', 'c3c3c3c3-0000-4000-8000-000000000003/minha.jpg') $$,
  'Cris sobe arquivo na própria pasta (controle: a regra não bloqueia tudo)'
);

-- ---------------------------------------------------------------------------
-- 3. Bia tentando mexer no perfil da Ana (cliente)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "b2b2b2b2-0000-4000-8000-000000000002", "role": "authenticated"}', true);

select is(
  (select count(*) from public.perfis where id = 'a1a1a1a1-0000-4000-8000-000000000001'),
  0::bigint, 'Bia não vê o perfil da Ana (cliente não é pública)'
);
select is_empty(
  $$ update public.perfis set nome = 'hackeado'
     where id = 'a1a1a1a1-0000-4000-8000-000000000001' returning id $$,
  'Bia não edita o perfil da Ana'
);

reset role;

-- ---------------------------------------------------------------------------
-- 4. Leitura pública (sem login)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"role": "anon"}', true);
set local role anon;

select is(
  (select nome from public.perfis where id = 'b2b2b2b2-0000-4000-8000-000000000002'),
  'Bia', 'sem login: perfil da prestadora aparece'
);
select is(
  (select count(*) from public.perfis where id = 'a1a1a1a1-0000-4000-8000-000000000001'),
  0::bigint, 'sem login: perfil da cliente não aparece'
);
select is(
  (select array_agg(caminho) from public.fotos_portfolio
     where prestadora_id = 'b2b2b2b2-0000-4000-8000-000000000002'),
  array['b2b2b2b2-0000-4000-8000-000000000002/trabalho.jpg'],
  'sem login: fotos da prestadora aparecem (galeria pública)'
);
select is(
  (select count(*) from public.servicos_prestadora
     where prestadora_id = 'b2b2b2b2-0000-4000-8000-000000000002'),
  1::bigint, 'sem login: serviços da prestadora aparecem'
);
select is(
  (select count(*) from storage.objects where bucket_id = 'portfolio'
     and name like 'b2b2b2b2-0000-4000-8000-000000000002/%'),
  0::bigint, 'sem login: não lista o bucket (a foto abre só pelo link público)'
);

reset role;

-- ---------------------------------------------------------------------------
-- 5. Conferência como admin: nada da Bia mudou
-- ---------------------------------------------------------------------------
select is(
  (select row(nome, bio, cidade, avatar_url)::text from public.perfis
     where id = 'b2b2b2b2-0000-4000-8000-000000000002'),
  row('Bia', 'Eletricista', 'João Pessoa', null::text)::text,
  'perfil da Bia continua igual'
);
select is(
  (select nome from public.perfis where id = 'a1a1a1a1-0000-4000-8000-000000000001'),
  'Ana', 'perfil da Ana continua igual'
);
select is(
  (select count(*) from public.fotos_portfolio where prestadora_id = 'b2b2b2b2-0000-4000-8000-000000000002'),
  1::bigint, 'foto da Bia continua registrada'
);
select is(
  (select array_agg(name order by name) from storage.objects
     where bucket_id = 'portfolio' and name like 'b2b2b2b2-0000-4000-8000-000000000002/%'),
  array['b2b2b2b2-0000-4000-8000-000000000002/trabalho.jpg'],
  'na pasta da Bia só está o arquivo dela'
);
select is(
  (select public from storage.buckets where id = 'portfolio'),
  true, 'bucket portfolio é público (a foto abre pelo link sem login)'
);

select * from finish();
rollback;
