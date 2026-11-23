-- Testes da 01_identidade.sql (pgTAP). Rodar no Supabase LOCAL:
--   supabase start && supabase test db
-- Tudo roda numa transação com rollback; nada fica no banco.
-- Contextos: postgres (admin), anon e authenticated com auth.uid() simulado
-- via request.jwt.claims, que é o que o PostgREST faz em cada requisição.

begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Contas de teste (só existem dentro desta transação)
--   A = cliente, B = prestadora, C = prestadora, D = sem papel
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@teste.local', '{"nome": "Ana"}'),
  ('22222222-2222-2222-2222-222222222222', 'b@teste.local', '{"nome": "Bia"}'),
  ('33333333-3333-3333-3333-333333333333', 'c@teste.local', '{"nome": "Cris", "papel": "prestadora"}'),
  ('44444444-4444-4444-4444-444444444444', 'd@teste.local', '{"papel": "admin", "nome": "   "}');

-- ---------------------------------------------------------------------------
-- 1. Estrutura
-- ---------------------------------------------------------------------------
select has_table('public', 'perfis', 'perfis existe');
select has_table('public', 'categorias_servico', 'categorias_servico existe');
select has_table('public', 'servicos_prestadora', 'servicos_prestadora existe');
select has_table('public', 'fotos_portfolio', 'fotos_portfolio existe');

select col_type_is('public', 'perfis', 'id', 'uuid', 'perfis.id é uuid');
select col_type_is('public', 'categorias_servico', 'id', 'bigint', 'categorias_servico.id é bigint');
select col_type_is('public', 'servicos_prestadora', 'categoria_id', 'bigint', 'servicos_prestadora.categoria_id é bigint');
select fk_ok('public', 'perfis', 'id', 'auth', 'users', 'id', 'perfis.id → auth.users.id');
select fk_ok('public', 'servicos_prestadora', 'prestadora_id', 'public', 'perfis', 'id', 'servicos → perfis');
select fk_ok('public', 'servicos_prestadora', 'categoria_id', 'public', 'categorias_servico', 'id', 'servicos → categorias');
select fk_ok('public', 'fotos_portfolio', 'prestadora_id', 'public', 'perfis', 'id', 'fotos → perfis');
select col_is_pk('public', 'servicos_prestadora', array['prestadora_id', 'categoria_id'], 'PK composta impede duplicata');

select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname in ('perfis', 'categorias_servico', 'servicos_prestadora', 'fotos_portfolio')
     and c.relrowsecurity),
  4::bigint,
  'RLS ligado nas 4 tabelas'
);

select ok((select count(*) from public.categorias_servico) >= 4, 'seed de categorias inserido');
select ok(exists (select 1 from public.categorias_servico where nome = 'Elétrica'), 'categoria Elétrica existe');

-- ---------------------------------------------------------------------------
-- 3. Trigger de perfil
-- ---------------------------------------------------------------------------
select is((select count(*) from public.perfis), 4::bigint, 'trigger criou um perfil por conta');
select is((select nome from public.perfis where id = '11111111-1111-1111-1111-111111111111'), 'Ana', 'nome vem dos metadados');
select ok((select papel is null from public.perfis where id = '33333333-3333-3333-3333-333333333333'), 'metadado papel=prestadora é ignorado');
select ok((select papel is null from public.perfis where id = '44444444-4444-4444-4444-444444444444'), 'metadado papel=admin é ignorado');
select ok((select nome is null from public.perfis where id = '44444444-4444-4444-4444-444444444444'), 'nome em branco vira null');

insert into auth.users (id, email, raw_user_meta_data)
values ('55555555-5555-5555-5555-555555555555', 'e@teste.local', jsonb_build_object('nome', repeat('x', 500)));
select is((select char_length(nome) from public.perfis where id = '55555555-5555-5555-5555-555555555555'), 80, 'nome longo é cortado e não quebra o cadastro');

insert into auth.users (id, email, raw_user_meta_data)
values ('66666666-6666-6666-6666-666666666666', 'f@teste.local', '{"nome": "x''); drop table public.perfis; --"}');
select ok(exists (select 1 from public.perfis where id = '66666666-6666-6666-6666-666666666666'), 'nome com payload de SQL vira texto comum');
select has_table('public', 'perfis', 'perfis continua existindo depois do payload');

-- Admin define os papéis iniciais (simula o onboarding de A e B)
update public.perfis set papel = 'cliente'    where id = '11111111-1111-1111-1111-111111111111';
update public.perfis set papel = 'prestadora' where id = '22222222-2222-2222-2222-222222222222';

-- ---------------------------------------------------------------------------
-- 4. Valores de papel
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ update public.perfis set papel = 'admin' where id = '33333333-3333-3333-3333-333333333333' $$,
  '23514', null, 'papel fora da lista é rejeitado (mesmo para admin)'
);
select throws_ok(
  $$ update public.perfis set papel = 'cliente' where id = '44444444-4444-4444-4444-444444444444' $$,
  '23514', null, 'papel sem nome é rejeitado'
);

-- ---------------------------------------------------------------------------
-- 5. A tentando editar B; campos protegidos
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', true);
set local role authenticated;

select is((select count(*) from public.perfis where id = '33333333-3333-3333-3333-333333333333'), 0::bigint, 'cliente A não enxerga perfil sem papel de outra conta');
select is((select count(*) from public.perfis where id = '22222222-2222-2222-2222-222222222222'), 1::bigint, 'cliente A enxerga prestadora B');
select lives_ok(
  $$ update public.perfis set nome = 'hackeado' where id = '22222222-2222-2222-2222-222222222222' $$,
  'update no perfil alheio não dá erro, mas não atinge linha'
);
select lives_ok(
  $$ update public.perfis set bio = 'minha bio', cidade = 'João Pessoa' where id = auth.uid() $$,
  'A edita o próprio perfil'
);
select throws_ok(
  $$ update public.perfis set id = '22222222-2222-2222-2222-222222222222' where id = auth.uid() $$,
  '42501', null, 'A não altera o próprio id'
);
select throws_ok(
  $$ update public.perfis set papel = 'prestadora' where id = auth.uid() $$,
  '42501', null, 'cliente não vira prestadora depois de escolher'
);
select throws_ok(
  $$ update public.perfis set papel = null where id = auth.uid() $$,
  '42501', null, 'papel não volta para null'
);
select throws_ok(
  $$ update public.perfis set criado_em = now() - interval '1 year' where id = auth.uid() $$,
  '42501', null, 'criado_em não é editável'
);
select throws_ok(
  $$ insert into public.perfis (id, nome) values ('77777777-7777-7777-7777-777777777777', 'x') $$,
  '42501', null, 'authenticated não insere perfil direto'
);
select throws_ok(
  $$ delete from public.perfis where id = auth.uid() $$,
  '42501', null, 'authenticated não apaga perfil direto'
);
select throws_ok(
  $$ insert into public.categorias_servico (nome) values ('Hack') $$,
  '42501', null, 'authenticated não cria categoria'
);
select throws_ok(
  $$ update public.categorias_servico set nome = 'Hack' $$,
  '42501', null, 'authenticated não edita categoria'
);

-- 6. Cliente tentando cadastrar serviço/foto
select throws_ok(
  $$ insert into public.servicos_prestadora (prestadora_id, categoria_id)
     select auth.uid(), id from public.categorias_servico limit 1 $$,
  '23514', null, 'cliente não cadastra serviço para si (trigger roda antes da RLS)'
);
select throws_ok(
  $$ insert into public.servicos_prestadora (prestadora_id, categoria_id)
     select '22222222-2222-2222-2222-222222222222', id from public.categorias_servico limit 1 $$,
  '42501', null, 'cliente não cadastra serviço em nome de prestadora'
);
select throws_ok(
  $$ insert into public.fotos_portfolio (prestadora_id, caminho)
     values (auth.uid(), auth.uid()::text || '/foto.jpg') $$,
  '23514', null, 'cliente não cadastra foto'
);

-- D (sem papel) escolhe papel: null → prestadora exige nome; com nome, passa
select set_config('request.jwt.claims', '{"sub": "44444444-4444-4444-4444-444444444444", "role": "authenticated"}', true);
select lives_ok(
  $$ update public.perfis set nome = 'Dani', papel = 'cliente' where id = auth.uid() $$,
  'onboarding: perfil sem papel escolhe papel uma vez'
);

reset role;
select is((select nome from public.perfis where id = '22222222-2222-2222-2222-222222222222'), 'Bia', 'perfil de B continua intacto');
select is((select cidade from public.perfis where id = '11111111-1111-1111-1111-111111111111'), 'João Pessoa', 'edição própria de A gravou');
select is((select papel from public.perfis where id = '11111111-1111-1111-1111-111111111111'), 'cliente', 'papel de A continua cliente');
select is((select papel from public.perfis where id = '44444444-4444-4444-4444-444444444444'), 'cliente', 'papel escolhido no onboarding gravou');
select ok(
  (select atualizado_em >= criado_em from public.perfis where id = '11111111-1111-1111-1111-111111111111'),
  'atualizado_em é mantido pelo trigger'
);

-- Integridade para todos os papéis: admin também não liga cliente a serviço
select throws_ok(
  $$ insert into public.servicos_prestadora (prestadora_id, categoria_id)
     select '11111111-1111-1111-1111-111111111111', id from public.categorias_servico limit 1 $$,
  '23514', null, 'nem admin cadastra serviço para cliente'
);
select throws_ok(
  $$ insert into public.servicos_prestadora (prestadora_id, categoria_id)
     values ('22222222-2222-2222-2222-222222222222', 999999) $$,
  '23503', null, 'categoria inexistente é rejeitada'
);
select throws_ok(
  $$ insert into public.fotos_portfolio (prestadora_id, caminho)
     values ('99999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999/x.jpg') $$,
  '23514', null, 'foto de usuária inexistente é rejeitada'
);
select throws_ok(
  $$ update public.perfis set avatar_url = 'javascript:alert(1)' where id = '22222222-2222-2222-2222-222222222222' $$,
  '23514', null, 'avatar_url só aceita http(s)'
);

-- ---------------------------------------------------------------------------
-- 7. Anônima
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"role": "anon"}', true);
set local role anon;

select is((select count(*) from public.perfis), 1::bigint, 'anon só lê perfis de prestadoras (B)');
select is((select count(*) from public.perfis where papel is distinct from 'prestadora'), 0::bigint, 'anon não lê clientes nem contas sem papel');
select ok((select count(*) from public.categorias_servico) >= 4, 'anon lê categorias');
select throws_ok($$ update public.perfis set nome = 'anon' $$, '42501', null, 'anon não edita perfis');
select throws_ok($$ insert into public.servicos_prestadora (prestadora_id, categoria_id) values ('22222222-2222-2222-2222-222222222222', 1) $$, '42501', null, 'anon não cria serviço');
select throws_ok($$ insert into public.fotos_portfolio (prestadora_id, caminho) values ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222/a.jpg') $$, '42501', null, 'anon não cria foto');
select throws_ok($$ delete from public.fotos_portfolio $$, '42501', null, 'anon não apaga fotos');
select throws_ok($$ delete from public.categorias_servico $$, '42501', null, 'anon não apaga categorias');
select throws_ok($$ select public.eh_prestadora('22222222-2222-2222-2222-222222222222') $$, '42501', null, 'anon não executa eh_prestadora');

reset role;

-- ---------------------------------------------------------------------------
-- 8. Prestadoras B e C: serviços e fotos próprios vs. alheios
-- ---------------------------------------------------------------------------
update public.perfis set papel = 'prestadora' where id = '33333333-3333-3333-3333-333333333333';

select set_config('request.jwt.claims', '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ insert into public.fotos_portfolio (prestadora_id, caminho)
     values (auth.uid(), auth.uid()::text || '/c1.jpg') $$,
  'C insere foto própria'
);

select set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', true);
select lives_ok(
  $$ insert into public.servicos_prestadora (prestadora_id, categoria_id)
     select auth.uid(), id from public.categorias_servico where nome = 'Elétrica' $$,
  'B cadastra serviço próprio'
);
select throws_ok(
  $$ insert into public.servicos_prestadora (prestadora_id, categoria_id)
     select auth.uid(), id from public.categorias_servico where nome = 'Elétrica' $$,
  '23505', null, 'serviço duplicado é rejeitado'
);
select throws_ok(
  $$ insert into public.servicos_prestadora (prestadora_id, categoria_id)
     select '33333333-3333-3333-3333-333333333333', id from public.categorias_servico limit 1 $$,
  '42501', null, 'B não cadastra serviço em nome de C'
);
select lives_ok(
  $$ insert into public.fotos_portfolio (prestadora_id, caminho)
     values (auth.uid(), auth.uid()::text || '/b1.jpg') $$,
  'B insere foto própria'
);
select throws_ok(
  $$ insert into public.fotos_portfolio (prestadora_id, caminho)
     values (auth.uid(), auth.uid()::text || '/b1.jpg') $$,
  '23505', null, 'caminho de foto duplicado é rejeitado'
);
select throws_ok(
  $$ insert into public.fotos_portfolio (prestadora_id, caminho)
     values ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333/b-hack.jpg') $$,
  '42501', null, 'B não insere foto em nome de C'
);
select throws_ok(
  $$ insert into public.fotos_portfolio (prestadora_id, caminho)
     values (auth.uid(), '33333333-3333-3333-3333-333333333333/b-hack.jpg') $$,
  '23514', null, 'B não registra caminho na pasta de C'
);
select throws_ok(
  $$ insert into public.fotos_portfolio (prestadora_id, caminho)
     values (auth.uid(), auth.uid()::text || '/sub/../x.jpg') $$,
  '23514', null, 'caminho com subpasta/.. é rejeitado'
);
select throws_ok(
  $$ update public.fotos_portfolio set prestadora_id = auth.uid() $$,
  '42501', null, 'ninguém faz update em fotos (sem trocar dona)'
);
select lives_ok(
  $$ delete from public.fotos_portfolio where prestadora_id = '33333333-3333-3333-3333-333333333333' $$,
  'delete na foto de C não dá erro, mas não atinge linha'
);
select lives_ok(
  $$ delete from public.servicos_prestadora where prestadora_id = '33333333-3333-3333-3333-333333333333' $$,
  'delete no serviço de C não atinge linha'
);

-- 12. Sem limite de quantidade: 50 fotos para a mesma prestadora
select lives_ok(
  $$ insert into public.fotos_portfolio (prestadora_id, caminho)
     select auth.uid(), auth.uid()::text || '/lote-' || g || '.jpg'
     from generate_series(1, 50) g $$,
  'B insere 50 fotos sem limite'
);
select lives_ok(
  $$ delete from public.fotos_portfolio where caminho = auth.uid()::text || '/b1.jpg' $$,
  'B apaga a própria foto'
);

reset role;
select is((select count(*) from public.fotos_portfolio where prestadora_id = '33333333-3333-3333-3333-333333333333'), 1::bigint, 'foto de C continua lá');
select is((select count(*) from public.fotos_portfolio where prestadora_id = '22222222-2222-2222-2222-222222222222'), 50::bigint, 'B ficou com 50 fotos (b1 apagada)');

-- Cascata: apagar a conta apaga perfil, serviços e fotos
delete from auth.users where id = '22222222-2222-2222-2222-222222222222';
select is((select count(*) from public.perfis where id = '22222222-2222-2222-2222-222222222222'), 0::bigint, 'conta apagada remove perfil');
select is((select count(*) from public.fotos_portfolio where prestadora_id = '22222222-2222-2222-2222-222222222222'), 0::bigint, 'conta apagada remove fotos');
select is((select count(*) from public.servicos_prestadora where prestadora_id = '22222222-2222-2222-2222-222222222222'), 0::bigint, 'conta apagada remove serviços');

-- ---------------------------------------------------------------------------
-- Storage: configuração do bucket
-- ---------------------------------------------------------------------------
select is((select public from storage.buckets where id = 'portfolio'), true, 'bucket portfolio é público para leitura');
select is((select file_size_limit from storage.buckets where id = 'portfolio'), 5242880::bigint, 'limite de 5 MB no bucket');
select is(
  (select allowed_mime_types from storage.buckets where id = 'portfolio'),
  array['image/jpeg', 'image/png', 'image/webp'],
  'MIME permitidos no bucket'
);
select is(
  (select count(*) from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and policyname like 'portfolio_%' and cmd = 'UPDATE'),
  0::bigint,
  'nenhuma policy de UPDATE no portfolio'
);

-- ---------------------------------------------------------------------------
-- 14. Funções: sem SQL dinâmico, search_path fixo, permissões mínimas
-- ---------------------------------------------------------------------------
select is(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('eh_prestadora', 'perfis_proteger_campos', 'criar_perfil_nova_usuaria', 'exigir_prestadora')
     and p.prosrc ~* '\m(execute|format)\M'),
  0::bigint,
  'nenhuma função da 01 usa EXECUTE/format'
);
select is(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('eh_prestadora', 'perfis_proteger_campos', 'criar_perfil_nova_usuaria', 'exigir_prestadora')
     and not (coalesce(p.proconfig, '{}') @> array['search_path=""'])),
  0::bigint,
  'toda função da 01 tem search_path vazio'
);
select ok(not has_function_privilege('authenticated', 'public.criar_perfil_nova_usuaria()', 'execute'), 'authenticated não executa a função do trigger');
select ok(not has_function_privilege('anon', 'public.criar_perfil_nova_usuaria()', 'execute'), 'anon não executa a função do trigger');
select ok(has_function_privilege('authenticated', 'public.eh_prestadora(uuid)', 'execute'), 'authenticated executa eh_prestadora (usada nas policies)');

select * from finish();
rollback;
