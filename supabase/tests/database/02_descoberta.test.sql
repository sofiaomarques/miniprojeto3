-- Testes da RLS das avaliações (02_descoberta.sql, issue #28). pgTAP.
-- Rodar no Supabase LOCAL:
--   supabase start && supabase test db
-- Tudo roda numa transação com rollback; nada fica no banco.
-- auth.uid() é simulado via request.jwt.claims, como o PostgREST faz.

begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Contas de teste (só existem dentro desta transação)
--   A, B = clientes · P, Q = prestadoras · N = sem papel (não fez onboarding)
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@teste.local', '{"nome": "Ana"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b@teste.local', '{"nome": "Bruna"}'),
  ('cccccccc-0000-0000-0000-000000000003', 'p@teste.local', '{"nome": "Paula"}'),
  ('dddddddd-0000-0000-0000-000000000004', 'q@teste.local', '{"nome": "Quitéria"}'),
  ('eeeeeeee-0000-0000-0000-000000000005', 'n@teste.local', '{"nome": "Nina"}');

update public.perfis set papel = 'cliente', bio = 'bio privada da Ana'
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';
update public.perfis set papel = 'cliente'
  where id = 'bbbbbbbb-0000-0000-0000-000000000002';
update public.perfis set papel = 'prestadora', cidade = 'João Pessoa'
  where id = 'cccccccc-0000-0000-0000-000000000003';
update public.perfis set papel = 'prestadora', cidade = 'Campina Grande'
  where id = 'dddddddd-0000-0000-0000-000000000004';

-- ---------------------------------------------------------------------------
-- 1. Estrutura
-- ---------------------------------------------------------------------------
select has_table('public', 'avaliacoes', 'avaliacoes existe');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.avaliacoes'::regclass),
  'RLS ligado em avaliacoes'
);
select has_view('public', 'prestadoras_resumo', 'view prestadoras_resumo existe');
select has_view('public', 'avaliacoes_publicas', 'view avaliacoes_publicas existe');
select hasnt_column('public', 'avaliacoes_publicas', 'cliente_bio', 'avaliacoes_publicas não expõe bio da cliente');
select hasnt_column('public', 'avaliacoes_publicas', 'cliente_cidade', 'avaliacoes_publicas não expõe cidade da cliente');

-- ---------------------------------------------------------------------------
-- 2. Cliente B avalia P (caminho feliz)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "bbbbbbbb-0000-0000-0000-000000000002", "role": "authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota, comentario)
     values ('cccccccc-0000-0000-0000-000000000003', auth.uid(), 3, 'ok, atrasou um pouco') $$,
  'B (cliente) avalia P (prestadora)'
);

-- ---------------------------------------------------------------------------
-- 3. Cliente A: avaliação própria e tentativas contra a de B
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "aaaaaaaa-0000-0000-0000-000000000001", "role": "authenticated"}', true);

select lives_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota, comentario)
     values ('cccccccc-0000-0000-0000-000000000003', auth.uid(), 5, 'excelente') $$,
  'A (cliente) avalia P (prestadora)'
);

-- Editar/apagar a avaliação de B: a RLS esconde a linha, então não dá erro,
-- mas nenhuma linha é atingida (conferido abaixo como admin).
select lives_ok(
  $$ update public.avaliacoes set nota = 1, comentario = 'editado pela A'
     where cliente_id = 'bbbbbbbb-0000-0000-0000-000000000002' $$,
  'update na avaliação de B não dá erro, mas não atinge linha'
);
select lives_ok(
  $$ delete from public.avaliacoes
     where cliente_id = 'bbbbbbbb-0000-0000-0000-000000000002' $$,
  'delete na avaliação de B não dá erro, mas não atinge linha'
);
-- "Roubar" a avaliação de B trocando a autora: coluna sem GRANT de update
select throws_ok(
  $$ update public.avaliacoes set cliente_id = auth.uid()
     where cliente_id = 'bbbbbbbb-0000-0000-0000-000000000002' $$,
  '42501', null, 'A não troca cliente_id (nem da avaliação de B)'
);

-- Inserir em nome de outra pessoa
select throws_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota)
     values ('dddddddd-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000002', 1) $$,
  '42501', null, 'A não insere avaliação com cliente_id de B'
);

-- Avaliar quem não é prestadora
select throws_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota)
     values ('bbbbbbbb-0000-0000-0000-000000000002', auth.uid(), 1) $$,
  '42501', null, 'A não avalia outra cliente (B)'
);
select throws_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota)
     values ('eeeeeeee-0000-0000-0000-000000000005', auth.uid(), 1) $$,
  '42501', null, 'A não avalia perfil sem papel (N)'
);
select throws_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota)
     values (auth.uid(), auth.uid(), 5) $$,
  '42501', null, 'A não se autoavalia'
);
select throws_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota)
     values ('99999999-9999-9999-9999-999999999999', auth.uid(), 5) $$,
  '42501', null, 'A não avalia perfil inexistente'
);

-- UNIQUE e CHECK
select throws_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota)
     values ('cccccccc-0000-0000-0000-000000000003', auth.uid(), 4) $$,
  '23505', null, 'segunda avaliação de A para P é rejeitada (UNIQUE)'
);
select throws_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota)
     values ('dddddddd-0000-0000-0000-000000000004', auth.uid(), 0) $$,
  '23514', null, 'nota 0 é rejeitada (CHECK)'
);
select throws_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota)
     values ('dddddddd-0000-0000-0000-000000000004', auth.uid(), 6) $$,
  '23514', null, 'nota 6 é rejeitada (CHECK)'
);
select throws_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota)
     values ('dddddddd-0000-0000-0000-000000000004', auth.uid(), null) $$,
  '23502', null, 'nota nula é rejeitada (NOT NULL)'
);
select throws_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota, comentario)
     values ('dddddddd-0000-0000-0000-000000000004', auth.uid(), 4, repeat('x', 1001)) $$,
  '23514', null, 'comentário com mais de 1000 caracteres é rejeitado'
);

-- Colunas protegidas na própria avaliação
select throws_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota, criada_em)
     values ('dddddddd-0000-0000-0000-000000000004', auth.uid(), 4, now() - interval '1 year') $$,
  '42501', null, 'A não forja criada_em no insert'
);
select throws_ok(
  $$ update public.avaliacoes set prestadora_id = 'dddddddd-0000-0000-0000-000000000004'
     where cliente_id = auth.uid() $$,
  '42501', null, 'A não move a própria avaliação para outra prestadora'
);
select throws_ok(
  $$ update public.avaliacoes set criada_em = now() - interval '1 year'
     where cliente_id = auth.uid() $$,
  '42501', null, 'A não altera criada_em da própria avaliação'
);
select throws_ok(
  $$ update public.avaliacoes set nota = 9 where cliente_id = auth.uid() $$,
  '23514', null, 'A não edita a própria nota para fora de 1 a 5'
);
select lives_ok(
  $$ update public.avaliacoes set nota = 4, comentario = 'muito bom'
     where cliente_id = auth.uid() $$,
  'A edita nota e comentário da própria avaliação'
);

-- ---------------------------------------------------------------------------
-- 4. Prestadora P: não avalia, não mexe nas avaliações sobre ela
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "cccccccc-0000-0000-0000-000000000003", "role": "authenticated"}', true);

select throws_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota)
     values ('dddddddd-0000-0000-0000-000000000004', auth.uid(), 1) $$,
  '42501', null, 'prestadora P não avalia prestadora Q'
);
select throws_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota)
     values (auth.uid(), 'aaaaaaaa-0000-0000-0000-000000000001', 5) $$,
  '42501', null, 'P não cria avaliação 5 estrelas para si em nome de A'
);
select lives_ok(
  $$ delete from public.avaliacoes where prestadora_id = auth.uid() $$,
  'P tenta apagar avaliações sobre ela: não dá erro, mas não atinge linha'
);
select lives_ok(
  $$ update public.avaliacoes set nota = 5 where prestadora_id = auth.uid() $$,
  'P tenta subir as próprias notas: não dá erro, mas não atinge linha'
);

-- ---------------------------------------------------------------------------
-- 5. Conta sem papel N
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "eeeeeeee-0000-0000-0000-000000000005", "role": "authenticated"}', true);

select throws_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota)
     values ('cccccccc-0000-0000-0000-000000000003', auth.uid(), 5) $$,
  '42501', null, 'conta sem papel (N) não avalia'
);

-- ---------------------------------------------------------------------------
-- 6. Conferência como admin: nada alheio mudou
-- ---------------------------------------------------------------------------
reset role;

select is(
  (select nota::int from public.avaliacoes where cliente_id = 'bbbbbbbb-0000-0000-0000-000000000002'),
  3, 'avaliação de B continua com nota 3'
);
select is(
  (select comentario from public.avaliacoes where cliente_id = 'bbbbbbbb-0000-0000-0000-000000000002'),
  'ok, atrasou um pouco', 'comentário de B continua intacto'
);
select is(
  (select nota::int from public.avaliacoes where cliente_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  4, 'edição própria de A gravou (nota 4, não 5 da P)'
);
select is((select count(*) from public.avaliacoes), 2::bigint, 'só as duas avaliações válidas existem');

-- ---------------------------------------------------------------------------
-- 7. Leitura pública sem login (anon)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"role": "anon"}', true);
set local role anon;

select is((select count(*) from public.avaliacoes), 2::bigint, 'anon lê avaliacoes');
select is(
  (select count(*) from public.avaliacoes_publicas where prestadora_id = 'cccccccc-0000-0000-0000-000000000003'),
  2::bigint, 'anon lê avaliacoes_publicas'
);
select is(
  (select cliente_nome from public.avaliacoes_publicas where cliente_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'Ana', 'avaliacoes_publicas mostra o nome da autora'
);
select is((select count(*) from public.perfis where papel = 'cliente'), 0::bigint, 'perfis de clientes continuam privados para anon');

select is((select count(*) from public.prestadoras_resumo), 2::bigint, 'anon lê prestadoras_resumo (só P e Q)');
select is(
  (select nota_media from public.prestadoras_resumo where id = 'cccccccc-0000-0000-0000-000000000003'),
  3.5::numeric, 'nota_media de P = (3 + 4) / 2'
);
select is(
  (select total_avaliacoes from public.prestadoras_resumo where id = 'cccccccc-0000-0000-0000-000000000003'),
  2, 'total_avaliacoes de P = 2'
);
select ok(
  (select nota_media is null and total_avaliacoes = 0 from public.prestadoras_resumo where id = 'dddddddd-0000-0000-0000-000000000004'),
  'Q sem avaliações: nota_media null, total 0'
);
select is(
  (select count(*) from public.prestadoras_resumo where cidade_normalizada = public.normalizar_texto('  JOAO pessoa ')),
  1::bigint, 'anon busca cidade sem acento/maiúscula'
);

select throws_ok(
  $$ insert into public.avaliacoes (prestadora_id, cliente_id, nota)
     values ('cccccccc-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 1) $$,
  '42501', null, 'anon não insere avaliação'
);
select throws_ok($$ update public.avaliacoes set nota = 1 $$, '42501', null, 'anon não edita avaliação');
select throws_ok($$ delete from public.avaliacoes $$, '42501', null, 'anon não apaga avaliação');
select throws_ok(
  $$ select public.perfil_tem_papel('cccccccc-0000-0000-0000-000000000003', 'prestadora') $$,
  '42501', null, 'anon não executa perfil_tem_papel'
);

-- ---------------------------------------------------------------------------
-- 8. Autora apaga a própria avaliação; cascata ao apagar a conta
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "aaaaaaaa-0000-0000-0000-000000000001", "role": "authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ delete from public.avaliacoes where cliente_id = auth.uid() $$,
  'A apaga a própria avaliação'
);

reset role;
select is((select count(*) from public.avaliacoes where cliente_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 0::bigint, 'avaliação de A foi apagada');
select is((select count(*) from public.avaliacoes where cliente_id = 'bbbbbbbb-0000-0000-0000-000000000002'), 1::bigint, 'avaliação de B continua lá');

delete from auth.users where id = 'bbbbbbbb-0000-0000-0000-000000000002';
select is((select count(*) from public.avaliacoes), 0::bigint, 'conta apagada remove as avaliações dela');

select * from finish();
rollback;
