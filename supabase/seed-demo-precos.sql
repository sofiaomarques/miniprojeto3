-- seed-demo-precos.sql — preço base e negociação dos serviços da demo.
--
-- Complementa o seed-demo.sql (P3, #40) sem mexer nele: aquele roda depois
-- das migrations 01, 02 e 03; este precisa também da 05_precos_servicos.sql.
-- Os valores batem com as conversas do seed (ex.: a Marina cobra R$ 150 na
-- limpeza do split e R$ 90 na instalação da máquina) e com os mocks
-- (frontend/lib/identidade/precos-mock.ts).
--
-- Como rodar: no Supabase de DESENVOLVIMENTO, DEPOIS do seed-demo.sql:
--   psql "$DATABASE_URL" -f supabase/seed-demo-precos.sql
-- Pode rodar de novo (só faz UPDATE). Serviço sem linha aqui fica
-- "a combinar". NUNCA rode em produção.

begin;

update public.servicos_prestadora sp
set preco_base = v.preco, aceita_negociar = v.negocia
from (values
  ('00000000-0000-4000-8000-0000000000a1'::uuid, 'Ar-condicionado',                150.00, true),
  ('00000000-0000-4000-8000-0000000000a1'::uuid, 'Instalação de eletrodomésticos',  90.00, false),
  ('00000000-0000-4000-8000-0000000000a2'::uuid, 'Encanamento',                    120.00, true),
  ('00000000-0000-4000-8000-0000000000a2'::uuid, 'Pequenos reparos',                 null, false),
  ('00000000-0000-4000-8000-0000000000a3'::uuid, 'Montagem de móveis',             180.00, false),
  ('00000000-0000-4000-8000-0000000000a4'::uuid, 'Elétrica',                        99.90, true),
  ('00000000-0000-4000-8000-0000000000a4'::uuid, 'Instalação de eletrodomésticos',  85.00, true)
) as v (prestadora_id, categoria, preco, negocia)
join public.categorias_servico c on c.nome = v.categoria
where sp.prestadora_id = v.prestadora_id
  and sp.categoria_id = c.id;

commit;
