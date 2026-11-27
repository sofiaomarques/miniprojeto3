-- seed-demo-seguidores.sql — quem segue quem nas contas da demo (#82).
--
-- Complementa o seed-demo.sql (P3, #40) sem mexer nele: aquele roda depois
-- das migrations 01, 02 e 03; este precisa também da 06_seguidores.sql.
-- Os pares são os mesmos do modo mock (frontend/lib/seguidores/mocks.ts):
--   * Beatriz e Fernanda se seguem: cada uma vê as indicações da outra na
--     aba Indicações (#81);
--   * as duas seguem a Marina, e a Fernanda segue a Camila: a página da
--     prestadora mostra quem a acompanha;
--   * a Marina segue a Joana (prestadora também segue prestadora).
--
-- Como rodar: no Supabase de DESENVOLVIMENTO, DEPOIS do seed-demo.sql:
--   psql "$DATABASE_URL" -f supabase/seed-demo-seguidores.sql
-- Pode rodar de novo: refaz só os follows entre as 6 contas da demo e não
-- toca em nenhuma outra conta. NUNCA rode em produção.

begin;

create temporary table demo_ids (id uuid primary key) on commit drop;
insert into demo_ids (id) values
  ('00000000-0000-4000-8000-0000000000a1'),
  ('00000000-0000-4000-8000-0000000000a2'),
  ('00000000-0000-4000-8000-0000000000a3'),
  ('00000000-0000-4000-8000-0000000000a4'),
  ('00000000-0000-4000-8000-0000000000c1'),
  ('00000000-0000-4000-8000-0000000000c2');

delete from public.seguidores
where seguidora_id in (select id from demo_ids)
  and seguida_id in (select id from demo_ids);

-- O seed roda como postgres e pode definir criado_em (o app não pode, pelo
-- GRANT por coluna da 06): as listas mostram a mais recente primeiro.
insert into public.seguidores (seguidora_id, seguida_id, criado_em)
values
  -- Beatriz (c1) e Fernanda (c2), amigas que se seguem
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000c2', now() - interval '12 days'),
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000c1', now() - interval '12 days' + interval '1 hour'),
  -- clientes que acompanham prestadoras
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a1', now() - interval '10 days'),
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000a1', now() - interval '9 days'),
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000a2', now() - interval '6 days'),
  -- prestadora que indica outra
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a3', now() - interval '11 days');

commit;
