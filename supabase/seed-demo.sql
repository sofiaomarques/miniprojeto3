-- seed-demo.sql — dados de demonstração da Repara (Pessoa 3, #40).
--
-- O que cria (tudo em João Pessoa, no nicho de serviços domésticos):
--   * 6 contas fixas com e-mail e senha conhecidos (tabela no README):
--       prestadoras Marina, Camila, Joana e Aline; clientes Beatriz e Fernanda
--     Mesmos ids e nomes dos mocks da identidade e da descoberta, para o modo
--     mock e o Supabase real mostrarem as mesmas pessoas.
--   * perfis completos (papel, nome, bio, cidade) e os serviços de cada
--     prestadora (categorias da 01);
--   * avaliações públicas com nota e comentário;
--   * conversas com histórico de dias diferentes, algumas ainda não lidas.
--
-- Fotos do portfólio NÃO entram aqui: o site monta a URL pública do arquivo
-- no Storage e o SQL não envia imagens. Sem o arquivo, a galeria mostraria
-- imagem quebrada. As fotos são enviadas pelo app (upload da #17).
--
-- Como rodar: no Supabase de DESENVOLVIMENTO, pelo SQL Editor (que roda como
-- postgres) ou com psql, DEPOIS das migrations 01, 02 e 03:
--   psql "$DATABASE_URL" -f supabase/seed-demo.sql
-- Pode rodar de novo: refaz serviços, avaliações e conversas entre as 6
-- contas e volta perfis e senhas ao estado da demo. As contas não são
-- apagadas, então fotos e avatar enviados pelo site continuam. Não toca em
-- nenhuma outra conta.
-- NUNCA rode em produção: a senha das contas está no README.

begin;

-- ===========================================================================
-- 0. Limpa a demonstração anterior, sem apagar as contas
-- ===========================================================================
-- As contas e os perfis ficam (são atualizados abaixo): assim as fotos do
-- portfólio e o avatar enviados pelo site sobrevivem a uma nova rodada.
-- Apagar a conta levaria as linhas de fotos_portfolio em cascata e deixaria
-- os arquivos órfãos no Storage, que o SQL não consegue apagar.
-- Sai só o que o seed cria entre as contas da demo (mensagens saem em
-- cascata com as conversas).
create temporary table demo_ids (id uuid primary key) on commit drop;
insert into demo_ids (id) values
  ('00000000-0000-4000-8000-0000000000a1'),
  ('00000000-0000-4000-8000-0000000000a2'),
  ('00000000-0000-4000-8000-0000000000a3'),
  ('00000000-0000-4000-8000-0000000000a4'),
  ('00000000-0000-4000-8000-0000000000c1'),
  ('00000000-0000-4000-8000-0000000000c2');

-- Desloga quem estiver nas contas da demo: a senha volta por SQL logo abaixo,
-- e trocar a senha por SQL não encerra sessões abertas. Os refresh tokens
-- saem em cascata.
delete from auth.sessions where user_id in (select id from demo_ids);

delete from public.conversas
where cliente_id in (select id from demo_ids)
  and prestadora_id in (select id from demo_ids);

delete from public.avaliacoes
where cliente_id in (select id from demo_ids)
  and prestadora_id in (select id from demo_ids);

delete from public.servicos_prestadora
where prestadora_id in (select id from demo_ids);

-- ===========================================================================
-- 1. Contas (Supabase Auth) com senha demo12345 e e-mail já confirmado
-- ===========================================================================
-- Os campos de token vazios ('' e não null) são exigidos pelo Supabase Auth
-- para o login por e-mail e senha funcionar em contas criadas por SQL.
create temporary table demo_contas (
  id    uuid primary key,
  email text not null,
  nome  text not null
) on commit drop;

insert into demo_contas (id, email, nome) values
  ('00000000-0000-4000-8000-0000000000a1', 'marina@demo.test',   'Marina Souza'),
  ('00000000-0000-4000-8000-0000000000a2', 'camila@demo.test',   'Camila Ribeiro'),
  ('00000000-0000-4000-8000-0000000000a3', 'joana@demo.test',    'Joana Lima'),
  ('00000000-0000-4000-8000-0000000000a4', 'aline@demo.test',    'Aline Costa'),
  ('00000000-0000-4000-8000-0000000000c1', 'beatriz@demo.test',  'Beatriz Alves'),
  ('00000000-0000-4000-8000-0000000000c2', 'fernanda@demo.test', 'Fernanda Dias');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', c.id, 'authenticated', 'authenticated',
  c.email, extensions.crypt('demo12345', extensions.gen_salt('bf')),
  now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
  jsonb_build_object('nome', c.nome),
  now() - interval '20 days', now() - interval '20 days',
  '', '', '', ''
from demo_contas c
-- Já existe (rodada anterior): volta o e-mail, a senha demo12345 e a
-- confirmação, caso alguém tenha mudado pelo site.
on conflict (id) do update
set email              = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    updated_at         = now();

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), c.id, c.id::text, 'email',
  jsonb_build_object('sub', c.id::text, 'email', c.email, 'email_verified', true),
  now(), now() - interval '20 days', now() - interval '20 days'
from demo_contas c
on conflict (provider_id, provider) do nothing;

-- ===========================================================================
-- 2. Perfis (o trigger da 01 cria a linha quando a conta nasce; aqui entra o
--    resto, como faria o onboarding). avatar_url não muda: fica o do site.
-- ===========================================================================
update public.perfis p
set papel  = v.papel,
    nome   = v.nome,
    bio    = v.bio,
    cidade = 'João Pessoa'
from (values
  ('00000000-0000-4000-8000-0000000000a1'::uuid, 'prestadora', 'Marina Souza',
   'Instalação e limpeza de ar-condicionado split há 8 anos. Atendo Manaíra, Tambaú e Cabo Branco com hora marcada.'),
  ('00000000-0000-4000-8000-0000000000a2'::uuid, 'prestadora', 'Camila Ribeiro',
   'Encanadora: vazamentos, torneiras, descargas, chuveiros e caixas d''água. Orçamento sem compromisso.'),
  ('00000000-0000-4000-8000-0000000000a3'::uuid, 'prestadora', 'Joana Lima',
   'Monto guarda-roupas, camas, estantes e prateleiras. Levo as ferramentas e deixo tudo limpo.'),
  ('00000000-0000-4000-8000-0000000000a4'::uuid, 'prestadora', 'Aline Costa',
   'Eletricista: tomadas, chuveiro elétrico, troca de disjuntor e instalação de luminárias.'),
  ('00000000-0000-4000-8000-0000000000c1'::uuid, 'cliente', 'Beatriz Alves',
   'Moro sozinha em Manaíra e prefiro contratar mulheres para serviços em casa.'),
  ('00000000-0000-4000-8000-0000000000c2'::uuid, 'cliente', 'Fernanda Dias',
   'Recém-chegada no Bessa, montando o apartamento aos poucos.')
) as v (id, papel, nome, bio)
where p.id = v.id;

-- Serviços de cada prestadora (categorias criadas pela 01).
insert into public.servicos_prestadora (prestadora_id, categoria_id)
select v.prestadora_id, c.id
from (values
  ('00000000-0000-4000-8000-0000000000a1'::uuid, 'Ar-condicionado'),
  ('00000000-0000-4000-8000-0000000000a1'::uuid, 'Instalação de eletrodomésticos'),
  ('00000000-0000-4000-8000-0000000000a2'::uuid, 'Encanamento'),
  ('00000000-0000-4000-8000-0000000000a2'::uuid, 'Pequenos reparos'),
  ('00000000-0000-4000-8000-0000000000a3'::uuid, 'Montagem de móveis'),
  ('00000000-0000-4000-8000-0000000000a4'::uuid, 'Elétrica'),
  ('00000000-0000-4000-8000-0000000000a4'::uuid, 'Instalação de eletrodomésticos')
) as v (prestadora_id, categoria)
join public.categorias_servico c on c.nome = v.categoria;

-- ===========================================================================
-- 3. Avaliações (uma por cliente e prestadora, regra da 02)
-- ===========================================================================
insert into public.avaliacoes (prestadora_id, cliente_id, nota, comentario, criada_em)
values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000c1', 5,
   'Limpou o split com todo cuidado e deixou tudo limpo. Me senti segura em casa.', now() - interval '10 days 21 hours'),
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000c2', 4,
   'Pontual e cuidadosa. Instalou a máquina de lavar e explicou como limpar o filtro.', now() - interval '9 days'),
  ('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-0000000000c2', 5,
   'Resolveu o vazamento da pia em meia hora e explicou o que tinha acontecido.', now() - interval '6 days 18 hours'),
  ('00000000-0000-4000-8000-0000000000a3', '00000000-0000-4000-8000-0000000000c1', 5,
   'Montou o guarda-roupa de 6 portas sem nenhum arranhão. Recomendo muito!', now() - interval '5 days'),
  ('00000000-0000-4000-8000-0000000000a4', '00000000-0000-4000-8000-0000000000c1', 3,
   'Trocou o chuveiro direitinho, mas chegou uma hora depois do combinado.', now() - interval '3 days');

-- ===========================================================================
-- 4. Conversas com histórico (o seed, como postgres, pode definir criada_em
--    e lida_em; o app não pode, pelos GRANTs da 03)
-- ===========================================================================
-- Datas relativas a now(): a demo parece recente sempre que o seed roda.
-- lida_em null = não lida (aparece no contador de quem recebeu).
with conversa as (
  insert into public.conversas (cliente_id, prestadora_id, criada_em)
  values
    ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a1', now() - interval '13 days'),
    ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000a1', now() - interval '11 days'),
    ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a3', now() - interval '6 days'),
    ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000a2', now() - interval '8 days')
  returning id, cliente_id, prestadora_id
)
insert into public.mensagens (conversa_id, autor_id, texto, criada_em, lida_em)
select c.id, a.autor_id, m.texto, now() - m.ha, case when m.lida then now() - m.ha + interval '5 minutes' end
from conversa c
join (values
  -- Beatriz × Marina: serviço combinado e feito (ela avaliou depois)
  ('c1', 'a1', 'c1', 'Oi, Marina! Quanto fica a limpeza de um split de 12 mil BTUs?', interval '13 days', true),
  ('c1', 'a1', 'a1', 'Oi, Beatriz! Fica R$ 150 com a higienização. Posso ir quinta de manhã.', interval '13 days' - interval '20 minutes', true),
  ('c1', 'a1', 'c1', 'Fechado! Moro em Manaíra, te mando o endereço certinho na quarta.', interval '13 days' - interval '35 minutes', true),
  ('c1', 'a1', 'a1', 'Combinado. Até quinta!', interval '12 days', true),
  ('c1', 'a1', 'c1', 'Marina, o ar ficou ótimo, obrigada! Já deixei minha avaliação.', interval '10 days 20 hours', false),
  -- Fernanda × Marina: já foi cliente (avaliou a instalação da máquina) e
  -- agora faz um pedido novo, ainda não lido pela Marina
  ('c2', 'a1', 'c2', 'Oi, Marina! Você instala máquina de lavar? Acabei de me mudar para o Bessa.', interval '11 days', true),
  ('c2', 'a1', 'a1', 'Instalo sim! Consigo ir amanhã às 14h, fica R$ 90.', interval '11 days' - interval '15 minutes', true),
  ('c2', 'a1', 'c2', 'Ótimo, até amanhã!', interval '11 days' - interval '20 minutes', true),
  ('c2', 'a1', 'c2', 'Oi, Marina! Agora preciso instalar um 9 mil BTUs no apartamento novo, você faz?', interval '1 day', false),
  ('c2', 'a1', 'c2', 'Já tenho o suporte, falta só a instalação.', interval '1 day' - interval '2 minutes', false),
  -- Beatriz × Joana: montagem feita e avaliada; a Beatriz ainda não viu o
  -- agradecimento da Joana
  ('c1', 'a3', 'c1', 'Oi, Joana! Preciso montar um guarda-roupa de 6 portas. Você tem horário sábado?', interval '6 days', true),
  ('c1', 'a3', 'a3', 'Tenho sim, às 9h. Fica R$ 180 e levo tudo que precisa.', interval '6 days' - interval '1 hour', true),
  ('c1', 'a3', 'a3', 'Oi, Beatriz! Obrigada pela avaliação, qualquer coisa é só chamar.', interval '4 days 22 hours', false),
  -- Fernanda × Camila: conversa encerrada, tudo lido
  ('c2', 'a2', 'c2', 'Oi, Camila! A torneira da cozinha está pingando. Você atende no Bessa?', interval '8 days', true),
  ('c2', 'a2', 'a2', 'Atendo sim! Consigo passar amanhã à tarde.', interval '8 days' - interval '30 minutes', true),
  ('c2', 'a2', 'c2', 'Perfeito, obrigada!', interval '8 days' - interval '40 minutes', true)
) as m (cli, pre, autor, texto, ha, lida)
  on c.cliente_id = ('00000000-0000-4000-8000-0000000000' || m.cli)::uuid
 and c.prestadora_id = ('00000000-0000-4000-8000-0000000000' || m.pre)::uuid
cross join lateral (
  select ('00000000-0000-4000-8000-0000000000' || m.autor)::uuid as autor_id
) a
order by m.ha desc;

commit;
