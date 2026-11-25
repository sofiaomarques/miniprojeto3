-- Testes da 03_chat.sql (pgTAP). Rodar no Supabase LOCAL:
--   supabase start && supabase test db
-- Tudo roda numa transação com rollback; nada fica no banco.
-- Contextos: postgres (admin), anon e authenticated com auth.uid() simulado
-- via request.jwt.claims, que é o que o PostgREST faz em cada requisição.

begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Contas de teste (só existem dentro desta transação)
--   A = cliente, B = cliente, P = prestadora, Q = prestadora, S = sem papel
insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-0000-0000-000000000001', 'a@chat.local', '{"nome": "Ana"}'),
  ('b0000000-0000-0000-0000-000000000002', 'b@chat.local', '{"nome": "Bia"}'),
  ('c0000000-0000-0000-0000-000000000003', 'p@chat.local', '{"nome": "Carla Ar-Condicionado"}'),
  ('d0000000-0000-0000-0000-000000000004', 'q@chat.local', '{"nome": "Dani Encanadora"}'),
  ('e0000000-0000-0000-0000-000000000005', 's@chat.local', '{"nome": "Sem Papel"}');

update public.perfis set papel = 'cliente'
  where id in ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002');
update public.perfis set papel = 'prestadora'
  where id in ('c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004');

-- ---------------------------------------------------------------------------
-- 1. Estrutura
-- ---------------------------------------------------------------------------
select has_table('public', 'conversas', 'conversas existe');
select has_table('public', 'mensagens', 'mensagens existe');
select has_view('public', 'conversas_resumo', 'conversas_resumo existe');
select fk_ok('public', 'conversas', 'cliente_id', 'public', 'perfis', 'id', 'conversas.cliente_id → perfis');
select fk_ok('public', 'conversas', 'prestadora_id', 'public', 'perfis', 'id', 'conversas.prestadora_id → perfis');
select fk_ok('public', 'mensagens', 'conversa_id', 'public', 'conversas', 'id', 'mensagens → conversas');
select fk_ok('public', 'mensagens', 'autor_id', 'public', 'perfis', 'id', 'mensagens.autor_id → perfis');
select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in ('conversas', 'mensagens') and c.relrowsecurity),
  2::bigint,
  'RLS ligado nas 2 tabelas'
);
select has_function('public', 'iniciar_conversa', array['uuid'], 'iniciar_conversa(uuid) existe');
select has_function('public', 'marcar_lidas', array['bigint'], 'marcar_lidas(bigint) existe');
select has_function('public', 'nao_lidas', 'nao_lidas() existe');
select has_function('public', 'participantes_das_minhas_conversas', 'participantes_das_minhas_conversas() existe');
select is(
  pg_get_function_result('public.participantes_das_minhas_conversas()'::regprocedure),
  'TABLE(id uuid, nome text, avatar_url text, papel text)',
  'participantes_das_minhas_conversas() devolve só id, nome, avatar_url e papel'
);
select ok(exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'mensagens_autor_id_idx'), 'índice em mensagens.autor_id');

-- ---------------------------------------------------------------------------
-- 2. GRANTs mínimos
-- ---------------------------------------------------------------------------
select ok(not has_table_privilege('anon', 'public.conversas', 'select'), 'anon não lê conversas');
select ok(not has_table_privilege('anon', 'public.mensagens', 'select'), 'anon não lê mensagens');
select ok(not has_table_privilege('anon', 'public.conversas_resumo', 'select'), 'anon não lê conversas_resumo');
select ok(not has_table_privilege('authenticated', 'public.mensagens', 'truncate'), 'authenticated não faz truncate');
select ok(not has_table_privilege('authenticated', 'public.conversas', 'insert'), 'authenticated não insere conversa direto');
select ok(not has_column_privilege('authenticated', 'public.mensagens', 'criada_em', 'insert'), 'app não escolhe criada_em');
select ok(not has_column_privilege('authenticated', 'public.mensagens', 'lida_em', 'insert'), 'app não escolhe lida_em');
select ok(not has_function_privilege('anon', 'public.iniciar_conversa(uuid)', 'execute'), 'anon não executa iniciar_conversa');
select ok(not has_function_privilege('anon', 'public.participantes_das_minhas_conversas()', 'execute'), 'anon não executa participantes_das_minhas_conversas');

-- ---------------------------------------------------------------------------
-- 3. iniciar_conversa (como a cliente A)
-- ---------------------------------------------------------------------------
-- Antes de conversar, a prestadora não enxerga a cliente (regra da 01).
select set_config('request.jwt.claims', '{"sub": "c0000000-0000-0000-0000-000000000003", "role": "authenticated"}', true);
set local role authenticated;
select is(
  (select count(*) from public.perfis where id = 'a0000000-0000-0000-0000-000000000001'),
  0::bigint,
  'sem conversa, prestadora não vê o perfil da cliente'
);

select set_config('request.jwt.claims', '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);

select ok(
  (select id from public.iniciar_conversa('c0000000-0000-0000-0000-000000000003')) is not null,
  'cliente inicia conversa com prestadora'
);
select is(
  (select id from public.iniciar_conversa('c0000000-0000-0000-0000-000000000003')),
  (select id from public.conversas where prestadora_id = 'c0000000-0000-0000-0000-000000000003'),
  'segunda chamada devolve a mesma conversa'
);
select is((select count(*) from public.conversas), 1::bigint, 'não duplica a conversa');
select throws_ok(
  $$ select public.iniciar_conversa('b0000000-0000-0000-0000-000000000002') $$,
  'P0002', null, 'cliente com cliente é recusado'
);
select throws_ok(
  $$ select public.iniciar_conversa('e0000000-0000-0000-0000-000000000005') $$,
  'P0002', null, 'perfil sem papel não recebe conversa'
);
select throws_ok(
  $$ insert into public.conversas (cliente_id, prestadora_id)
     values ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004') $$,
  '42501', null, 'insert direto em conversas é bloqueado'
);

-- prestadora P e conta sem papel não iniciam
select set_config('request.jwt.claims', '{"sub": "c0000000-0000-0000-0000-000000000003", "role": "authenticated"}', true);
select throws_ok(
  $$ select public.iniciar_conversa('d0000000-0000-0000-0000-000000000004') $$,
  '42501', null, 'prestadora não inicia conversa'
);
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000005", "role": "authenticated"}', true);
select throws_ok(
  $$ select public.iniciar_conversa('c0000000-0000-0000-0000-000000000003') $$,
  '42501', null, 'conta sem papel não inicia conversa'
);
reset role;

-- ---------------------------------------------------------------------------
-- 4. Mensagens (A e P)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$ insert into public.mensagens (conversa_id, autor_id, texto)
     select id, 'a0000000-0000-0000-0000-000000000001', 'Oi! Quanto fica a limpeza do split?'
     from public.conversas $$,
  'cliente envia mensagem'
);
select throws_ok(
  $$ insert into public.mensagens (conversa_id, autor_id, texto, lida_em)
     select id, 'a0000000-0000-0000-0000-000000000001', 'x', now() from public.conversas $$,
  '42501', null, 'app não envia lida_em'
);
select throws_ok(
  $$ insert into public.mensagens (conversa_id, autor_id, texto)
     select id, 'c0000000-0000-0000-0000-000000000003', 'x' from public.conversas $$,
  '42501', null, 'cliente não envia em nome da prestadora'
);
select throws_ok(
  $$ insert into public.mensagens (conversa_id, autor_id, texto)
     select id, 'a0000000-0000-0000-0000-000000000001', E'  \n\t\r\n ' from public.conversas $$,
  '23514', null, 'mensagem só com espaços e quebras de linha é recusada'
);
select throws_ok(
  $$ insert into public.mensagens (conversa_id, autor_id, texto)
     select id, 'a0000000-0000-0000-0000-000000000001', 'a' || repeat(' ', 5000) from public.conversas $$,
  '23514', null, 'limite de 2000 conta os espaços do fim'
);
select lives_ok(
  $$ insert into public.mensagens (conversa_id, autor_id, texto)
     select id, 'a0000000-0000-0000-0000-000000000001', repeat('a', 2000) from public.conversas $$,
  'mensagem com exatamente 2000 caracteres passa'
);
select ok(
  (select ultima_mensagem_em is not null from public.conversas),
  'ultima_mensagem_em é atualizada'
);
select throws_ok(
  $$ update public.mensagens set texto = 'editado' $$,
  '42501', null, 'ninguém edita mensagem'
);
select throws_ok(
  $$ delete from public.mensagens $$,
  '42501', null, 'ninguém apaga mensagem'
);
select throws_ok(
  $$ delete from public.conversas $$,
  '42501', null, 'ninguém apaga conversa'
);

select set_config('request.jwt.claims', '{"sub": "c0000000-0000-0000-0000-000000000003", "role": "authenticated"}', true);
select lives_ok(
  $$ insert into public.mensagens (conversa_id, autor_id, texto)
     select id, 'c0000000-0000-0000-0000-000000000003', 'Oi Ana! R$ 150, posso amanhã.'
     from public.conversas $$,
  'prestadora responde'
);
reset role;

-- ---------------------------------------------------------------------------
-- 5. Terceiras pessoas (B, Q e anon)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "b0000000-0000-0000-0000-000000000002", "role": "authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.conversas), 0::bigint, 'outra cliente não vê a conversa');
select is((select count(*) from public.mensagens), 0::bigint, 'outra cliente não vê as mensagens');
select is((select count(*) from public.conversas_resumo), 0::bigint, 'outra cliente não vê na conversas_resumo');
select is(public.nao_lidas(), 0, 'outra cliente não conta não lidas dos outros');
select is(
  (select count(*) from public.perfis where id = 'a0000000-0000-0000-0000-000000000001'),
  0::bigint,
  'outra cliente não vê o perfil da cliente da conversa'
);
select is_empty(
  $$ select 1 from public.participantes_das_minhas_conversas() $$,
  'outra cliente não recebe participantes de conversas dos outros'
);
reset role;

-- id da conversa A–P, lido como admin, para os próximos testes
select set_config('teste.conversa', (select id::text from public.conversas), true);

set local role authenticated;
select throws_ok(
  $$ insert into public.mensagens (conversa_id, autor_id, texto)
     values (current_setting('teste.conversa')::bigint, 'b0000000-0000-0000-0000-000000000002', 'x') $$,
  '42501', null, 'outra cliente não envia na conversa dos outros'
);
select is(public.marcar_lidas(current_setting('teste.conversa')::bigint), 0, 'outra cliente não marca como lidas');

select set_config('request.jwt.claims', '{"sub": "d0000000-0000-0000-0000-000000000004", "role": "authenticated"}', true);
select is((select count(*) from public.mensagens), 0::bigint, 'outra prestadora não vê as mensagens');
select is(
  (select count(*) from public.perfis where id = 'a0000000-0000-0000-0000-000000000001'),
  0::bigint,
  'outra prestadora não vê o perfil da cliente'
);
reset role;

select set_config('request.jwt.claims', '{"role": "anon"}', true);
set local role anon;
select throws_ok($$ select * from public.mensagens $$, '42501', null, 'anon não lê mensagens');
select throws_ok($$ select public.nao_lidas() $$, '42501', null, 'anon não executa nao_lidas');
reset role;

-- ---------------------------------------------------------------------------
-- 6. Não lidas e conversas_resumo
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);
set local role authenticated;
select is(public.nao_lidas(), 1, 'cliente tem 1 não lida');
select is((select outra_nome from public.conversas_resumo), 'Carla Ar-Condicionado', 'resumo da cliente mostra a prestadora');
select is((select ultima_mensagem_texto from public.conversas_resumo), 'Oi Ana! R$ 150, posso amanhã.', 'resumo mostra a última mensagem');
select is((select nao_lidas from public.conversas_resumo), 1, 'resumo conta 1 não lida');

select set_config('request.jwt.claims', '{"sub": "c0000000-0000-0000-0000-000000000003", "role": "authenticated"}', true);
select is(public.nao_lidas(), 2, 'prestadora tem 2 não lidas');
select is_empty(
  $$ select 1 from public.perfis where id = 'a0000000-0000-0000-0000-000000000001' $$,
  'com conversa, prestadora ainda não lê o perfil da cliente direto'
);
select is(
  (select array[nome, avatar_url] from public.participantes_das_minhas_conversas() where id = 'a0000000-0000-0000-0000-000000000001'),
  array['Ana', null],
  'prestadora recebe só nome e avatar da cliente da conversa'
);
select is((select count(*) from public.conversas_resumo), 1::bigint, 'conversa aparece na lista da prestadora');
select is((select outra_nome from public.conversas_resumo), 'Ana', 'resumo da prestadora mostra a cliente');
select is(
  (select outra_id from public.conversas_resumo),
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'outra_id da prestadora é a cliente'
);
select is(public.marcar_lidas(current_setting('teste.conversa')::bigint), 2, 'marcar_lidas marca as 2');
select is(public.nao_lidas(), 0, 'não lidas da prestadora zeram');

select set_config('request.jwt.claims', '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);
select is(public.nao_lidas(), 1, 'a não lida da cliente continua');
reset role;

-- ---------------------------------------------------------------------------
-- 7. Seed (admin) monta histórico
-- ---------------------------------------------------------------------------
select lives_ok(
  $$ insert into public.mensagens (conversa_id, autor_id, texto, criada_em, lida_em)
     values (current_setting('teste.conversa')::bigint, 'a0000000-0000-0000-0000-000000000001',
             'Mensagem antiga do seed', now() - interval '3 days', now() - interval '3 days') $$,
  'seed insere mensagem antiga e já lida'
);
select is(
  (select lida_em is not null from public.mensagens where texto = 'Mensagem antiga do seed'),
  true,
  'seed mantém lida_em'
);
select ok(
  (select ultima_mensagem_em > now() - interval '1 day' from public.conversas),
  'mensagem antiga não faz ultima_mensagem_em voltar no tempo'
);

-- ---------------------------------------------------------------------------
-- 8. Realtime
-- ---------------------------------------------------------------------------
select is(
  (select count(*) from pg_publication_tables
   where pubname = 'supabase_realtime' and schemaname = 'public'
     and tablename in ('mensagens', 'conversas')),
  2::bigint,
  'mensagens e conversas estão no Realtime'
);

select * from finish();
rollback;
