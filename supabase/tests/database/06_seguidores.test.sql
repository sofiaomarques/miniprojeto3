-- Testes de seguidores (06_seguidores.sql). pgTAP; roda depois da 01 e da 02:
--   supabase start && supabase test db
-- Tudo roda numa transação com rollback; nada fica no banco. auth.uid() é
-- simulado via request.jwt.claims, como o PostgREST faz em cada requisição.
--
-- Contas: A, B = clientes · P = prestadora · N = sem papel (não fez onboarding).
-- Tentativas em linha alheia usam `returning` + is_empty, então falham na
-- hora se a policy deixar passar.

begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('a6a6a6a6-0000-4000-8000-000000000001', 'a@seg.local', '{"nome": "Ana Luísa"}'),
  ('b6b6b6b6-0000-4000-8000-000000000002', 'b@seg.local', '{"nome": "Bruna"}'),
  ('c6c6c6c6-0000-4000-8000-000000000003', 'p@seg.local', '{"nome": "Paula"}'),
  ('d6d6d6d6-0000-4000-8000-000000000004', 'n@seg.local', '{"nome": "Nina"}');

update public.perfis set papel = 'cliente', bio = 'bio privada', cidade = 'Recife'
  where id = 'a6a6a6a6-0000-4000-8000-000000000001';
update public.perfis set papel = 'cliente'
  where id = 'b6b6b6b6-0000-4000-8000-000000000002';
update public.perfis set papel = 'prestadora'
  where id = 'c6c6c6c6-0000-4000-8000-000000000003';

-- ---------------------------------------------------------------------------
-- 1. Estrutura
-- ---------------------------------------------------------------------------
select has_table('public', 'seguidores', 'seguidores existe');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.seguidores'::regclass),
  'RLS ligado em seguidores'
);
select has_view('public', 'pessoas_publicas', 'view pessoas_publicas existe');
select has_view('public', 'seguidores_publicos', 'view seguidores_publicos existe');
select hasnt_column('public', 'pessoas_publicas', 'bio', 'pessoas_publicas não expõe bio');
select hasnt_column('public', 'pessoas_publicas', 'cidade', 'pessoas_publicas não expõe cidade');

-- ---------------------------------------------------------------------------
-- 2. A (cliente) segue B (cliente) e P (prestadora)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "a6a6a6a6-0000-4000-8000-000000000001", "role": "authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$ insert into public.seguidores (seguidora_id, seguida_id)
     values (auth.uid(), 'b6b6b6b6-0000-4000-8000-000000000002') $$,
  'A segue B (cliente segue amiga)'
);
select lives_ok(
  $$ insert into public.seguidores (seguidora_id, seguida_id)
     values (auth.uid(), 'c6c6c6c6-0000-4000-8000-000000000003') $$,
  'A segue P (cliente segue prestadora)'
);
select throws_ok(
  $$ insert into public.seguidores (seguidora_id, seguida_id)
     values (auth.uid(), 'b6b6b6b6-0000-4000-8000-000000000002') $$,
  '23505', null, 'seguir a mesma pessoa duas vezes falha'
);
select throws_ok(
  $$ insert into public.seguidores (seguidora_id, seguida_id)
     values (auth.uid(), auth.uid()) $$,
  '23514', null, 'ninguém segue a si mesma'
);
select throws_ok(
  $$ insert into public.seguidores (seguidora_id, seguida_id)
     values ('b6b6b6b6-0000-4000-8000-000000000002', 'c6c6c6c6-0000-4000-8000-000000000003') $$,
  '42501', null, 'A não cria "B segue P" em nome de B'
);
select throws_ok(
  $$ insert into public.seguidores (seguidora_id, seguida_id)
     values (auth.uid(), 'd6d6d6d6-0000-4000-8000-000000000004') $$,
  '42501', null, 'não dá para seguir conta sem papel'
);
select throws_ok(
  $$ insert into public.seguidores (seguidora_id, seguida_id, criado_em)
     values (auth.uid(), 'd6d6d6d6-0000-4000-8000-000000000004', now() - interval '1 year') $$,
  '42501', 'permission denied for table seguidores', 'criado_em não é escolhido pelo app (GRANT por coluna)'
);
select throws_ok(
  $$ update public.seguidores set seguida_id = 'b6b6b6b6-0000-4000-8000-000000000002'
     where seguidora_id = auth.uid() $$,
  '42501', null, 'sem update: seguir outra pessoa é apagar e inserir'
);

-- ---------------------------------------------------------------------------
-- 3. P (prestadora) segue A; N (sem papel) não segue ninguém
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "c6c6c6c6-0000-4000-8000-000000000003", "role": "authenticated"}', true);
select lives_ok(
  $$ insert into public.seguidores (seguidora_id, seguida_id)
     values (auth.uid(), 'a6a6a6a6-0000-4000-8000-000000000001') $$,
  'P segue A (prestadora segue cliente)'
);

select set_config('request.jwt.claims', '{"sub": "d6d6d6d6-0000-4000-8000-000000000004", "role": "authenticated"}', true);
select throws_ok(
  $$ insert into public.seguidores (seguidora_id, seguida_id)
     values (auth.uid(), 'c6c6c6c6-0000-4000-8000-000000000003') $$,
  '42501', null, 'conta sem papel não segue ninguém'
);
select is_empty(
  $$ select 1 from public.seguidores $$,
  'conta sem papel não lê a tabela seguidores (só as próprias linhas)'
);
select is_empty(
  $$ select 1 from public.pessoas_publicas $$,
  'conta sem papel não lista pessoas da rede'
);
select is_empty(
  $$ select 1 from public.seguidores_publicos $$,
  'conta sem papel não vê as listas de seguidores'
);

-- ---------------------------------------------------------------------------
-- 4. Leitura: B (logada) vê listas com nomes; contagem é pública
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "b6b6b6b6-0000-4000-8000-000000000002", "role": "authenticated"}', true);

select is(
  (select count(*)::int from public.seguidores_publicos
    where seguida_id = 'c6c6c6c6-0000-4000-8000-000000000003'),
  1, 'B vê quem segue P'
);
select is_empty(
  $$ select 1 from public.seguidores where seguidora_id <> auth.uid() $$,
  'B só lê as próprias linhas em public.seguidores'
);
select is(
  (select seguidora_nome from public.seguidores_publicos
    where seguida_id = 'c6c6c6c6-0000-4000-8000-000000000003'),
  'Ana Luísa', 'a lista traz o nome da cliente A (que não é pública na 01)'
);
select is(
  (select count(*)::int from public.pessoas_publicas
    where id in ('a6a6a6a6-0000-4000-8000-000000000001', 'd6d6d6d6-0000-4000-8000-000000000004')),
  1, 'pessoas_publicas mostra A e esconde N (sem papel)'
);
select is(
  (select count(*)::int from public.pessoas_publicas
    where nome_normalizado like '%' || public.normalizar_texto('ANA LUISA') || '%'
      and id = 'a6a6a6a6-0000-4000-8000-000000000001'),
  1, 'busca por nome sem acento e sem maiúscula'
);
select is_empty(
  $$ select 1 from public.perfis where id = 'a6a6a6a6-0000-4000-8000-000000000001' $$,
  'perfis continua escondendo a cliente A (bio e cidade privadas)'
);
select results_eq(
  $$ select seguidores, seguindo from public.contar_seguidores('a6a6a6a6-0000-4000-8000-000000000001') $$,
  $$ values (1::bigint, 2::bigint) $$,
  'contagem de A: 1 seguidora (P) e seguindo 2 (B e P)'
);

-- B tenta desfazer o "A segue P": não apaga nada
select is_empty(
  $$ delete from public.seguidores
     where seguidora_id = 'a6a6a6a6-0000-4000-8000-000000000001'
     returning 1 $$,
  'B não desfaz quem A segue'
);

-- ---------------------------------------------------------------------------
-- 5. anon: só a contagem
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;

select results_eq(
  $$ select seguidores from public.contar_seguidores('c6c6c6c6-0000-4000-8000-000000000003') $$,
  $$ values (1::bigint) $$,
  'anon vê quantas pessoas seguem P'
);
select throws_ok(
  $$ select 1 from public.seguidores $$,
  '42501', null, 'anon não lê a tabela seguidores'
);
select throws_ok(
  $$ select 1 from public.seguidores_publicos $$,
  '42501', null, 'anon não lê a lista com nomes'
);
select throws_ok(
  $$ select 1 from public.pessoas_publicas $$,
  '42501', null, 'anon não lê pessoas_publicas'
);
select throws_ok(
  $$ insert into public.seguidores (seguidora_id, seguida_id)
     values ('a6a6a6a6-0000-4000-8000-000000000001', 'b6b6b6b6-0000-4000-8000-000000000002') $$,
  '42501', null, 'anon não segue ninguém'
);

-- ---------------------------------------------------------------------------
-- 6. A deixa de seguir B
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '{"sub": "a6a6a6a6-0000-4000-8000-000000000001", "role": "authenticated"}', true);
set local role authenticated;

select isnt_empty(
  $$ delete from public.seguidores
     where seguidora_id = auth.uid() and seguida_id = 'b6b6b6b6-0000-4000-8000-000000000002'
     returning 1 $$,
  'A deixa de seguir B'
);
select results_eq(
  $$ select seguindo from public.contar_seguidores(auth.uid()) $$,
  $$ values (1::bigint) $$,
  'A segue só P agora'
);

-- ---------------------------------------------------------------------------
-- 7. Apagar a conta leva junto os follows (on delete cascade)
-- ---------------------------------------------------------------------------
reset role;
delete from auth.users where id = 'c6c6c6c6-0000-4000-8000-000000000003';
select is(
  (select count(*)::int from public.seguidores
    where 'c6c6c6c6-0000-4000-8000-000000000003' in (seguidora_id, seguida_id)),
  0, 'conta apagada some dos seguidores e do seguindo'
);

select * from finish();
rollback;
