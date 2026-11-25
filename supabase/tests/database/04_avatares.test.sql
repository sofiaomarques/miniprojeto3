-- Testes da 04_avatares.sql (pgTAP). Rodar no Supabase LOCAL depois da 01:
--   supabase start && supabase test db
-- Tudo roda numa transação com rollback; nada fica no banco.
-- Contas: A = cliente, B = prestadora, D = sem papel (ainda no onboarding).

begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@teste.local', '{"nome": "Ana"}'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b@teste.local', '{"nome": "Bia"}'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'd@teste.local', '{"nome": "Duda"}');
update public.perfis set papel = 'cliente' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
update public.perfis set papel = 'prestadora' where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

-- ---------------------------------------------------------------------------
-- 1. Configuração do bucket
-- ---------------------------------------------------------------------------
select is((select public from storage.buckets where id = 'avatares'), true, 'bucket avatares é público');
select is((select file_size_limit from storage.buckets where id = 'avatares'), 2097152::bigint, 'limite de 2 MB');
select is(
  (select allowed_mime_types from storage.buckets where id = 'avatares'),
  array['image/jpeg', 'image/png', 'image/webp'],
  'só JPEG, PNG e WebP'
);
select is((select public from storage.buckets where id = 'portfolio'), true, 'bucket portfolio da 01 continua igual');

-- ---------------------------------------------------------------------------
-- 2. Upload: qualquer conta, só na própria pasta, um nível só
-- ---------------------------------------------------------------------------
set local role authenticated;

select set_config('request.jwt.claims', '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated"}', true);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatares', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/a.png') $$,
  'CLIENTE envia avatar na própria pasta'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatares', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/x.png') $$,
  '42501', null, 'cliente não envia na pasta de outra conta'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatares', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/sub/a.png') $$,
  '42501', null, 'subpasta é recusada (um nível só)'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('portfolio', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/a.png') $$,
  '42501', null, 'cliente continua sem enviar no portfolio (regra da 01 intacta)'
);

select set_config('request.jwt.claims', '{"sub": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "role": "authenticated"}', true);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatares', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/b.png') $$,
  'PRESTADORA envia avatar na própria pasta'
);

select set_config('request.jwt.claims', '{"sub": "dddddddd-dddd-4ddd-8ddd-dddddddddddd", "role": "authenticated"}', true);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatares', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd/d.png') $$,
  'conta SEM PAPEL também envia avatar'
);

-- ---------------------------------------------------------------------------
-- 3. Leitura e remoção via API: só a própria pasta
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated"}', true);
select is(
  (select array_agg(name order by name) from storage.objects where bucket_id = 'avatares'),
  array['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/a.png'],
  'cliente enxerga só o próprio avatar via API'
);
select lives_ok($$ delete from storage.objects where bucket_id = 'avatares' $$, 'delete roda');
reset role;
select is(
  (select array_agg(name order by name) from storage.objects where bucket_id = 'avatares'),
  array['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/b.png', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd/d.png'],
  'o delete da cliente apagou só o avatar dela'
);

-- Sem login (anon) não envia nada.
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatares', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/z.png') $$,
  '42501', null, 'anon não envia avatar'
);
reset role;

-- ---------------------------------------------------------------------------
-- 4. avatar_url em perfis: o link público do Storage passa no CHECK da 01
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated"}', true);
select lives_ok(
  $$ update public.perfis
       set avatar_url = 'https://exemplo.supabase.co/storage/v1/object/public/avatares/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/a.png'
     where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  'dona grava o link público em avatar_url'
);
select is(
  (select count(*)::int from public.perfis where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and avatar_url is null),
  1,
  'a prestadora continua sem avatar (cada uma só altera o próprio perfil)'
);
reset role;

select * from finish();
rollback;
