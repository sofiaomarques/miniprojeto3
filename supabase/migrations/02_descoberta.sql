-- 02_descoberta.sql — avaliações públicas e busca de prestadoras (Pessoa 2).
-- Roda depois de 01_identidade.sql, que fornece:
--   perfis(id uuid, nome, avatar_url, cidade, papel 'cliente' | 'prestadora')
--   categorias_servico(id, nome)
--   servicos_prestadora(prestadora_id, categoria_id)

-- ---------------------------------------------------------------------------
-- Texto sem acento e sem maiúscula (busca de cidade)
-- ---------------------------------------------------------------------------
create extension if not exists unaccent with schema extensions;

-- unaccent() não é IMMUTABLE; este wrapper é seguro porque o dicionário é fixo.
create function public.normalizar_texto(texto text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(extensions.unaccent(btrim($1)));
$$;

-- ---------------------------------------------------------------------------
-- Papel de um perfil (security definer: não depende da RLS de perfis)
-- ---------------------------------------------------------------------------
create function public.perfil_tem_papel(perfil_id uuid, papel_esperado text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
    where id = perfil_id and papel = papel_esperado
  );
$$;

-- Como `eh_prestadora` da 01: só quem está logada executa (não vira RPC pública).
revoke all on function public.perfil_tem_papel(uuid, text) from public, anon;
grant execute on function public.perfil_tem_papel(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Avaliações
-- ---------------------------------------------------------------------------
create table public.avaliacoes (
  id            bigint generated always as identity primary key,
  prestadora_id uuid not null references public.perfis (id) on delete cascade,
  cliente_id    uuid not null references public.perfis (id) on delete cascade,
  nota          smallint not null check (nota between 1 and 5),
  comentario    text check (char_length(comentario) <= 1000),
  criada_em     timestamptz not null default now(),
  unique (prestadora_id, cliente_id),
  check (prestadora_id <> cliente_id)
);

create index avaliacoes_cliente_id_idx on public.avaliacoes (cliente_id);

alter table public.avaliacoes enable row level security;

create policy avaliacoes_leitura_publica on public.avaliacoes
  for select to anon, authenticated
  using (true);

-- CHECK não cruza tabelas, por isso os papéis são validados na policy.
create policy avaliacoes_insert_da_cliente on public.avaliacoes
  for insert to authenticated
  with check (
    cliente_id = (select auth.uid())
    and public.perfil_tem_papel(cliente_id, 'cliente')
    and public.perfil_tem_papel(prestadora_id, 'prestadora')
  );

-- Update só mexe em nota e comentário (ver grants abaixo), então a prestadora
-- e a autora não mudam e não precisam ser revalidadas.
create policy avaliacoes_update_da_autora on public.avaliacoes
  for update to authenticated
  using (cliente_id = (select auth.uid()))
  with check (cliente_id = (select auth.uid()));

create policy avaliacoes_delete_da_autora on public.avaliacoes
  for delete to authenticated
  using (cliente_id = (select auth.uid()));

-- A RLS filtra linhas, não colunas. O Supabase dá ALL em tabelas novas de
-- `public`; sem isto, a autora poderia forjar `criada_em` ou mover a avaliação
-- para outra prestadora com UPDATE em `prestadora_id`.
revoke all on table public.avaliacoes from anon, authenticated;
grant select on table public.avaliacoes to anon, authenticated;
grant insert (prestadora_id, cliente_id, nota, comentario)
  on table public.avaliacoes to authenticated;
grant update (nota, comentario) on table public.avaliacoes to authenticated;
grant delete on table public.avaliacoes to authenticated;

-- ---------------------------------------------------------------------------
-- Resumo para a busca: uma linha por prestadora
--   categorias: jsonb [{id, nome}]  (filtrar com categorias @> '[{"id": 3}]')
--   nota_media: média com 1 casa, null sem avaliações
--   cidade_normalizada: comparar com normalizar_texto(<busca>)
-- security_invoker: a view respeita a RLS de perfis e das demais tabelas.
-- ---------------------------------------------------------------------------
create view public.prestadoras_resumo
with (security_invoker = true) as
select
  p.id,
  p.nome,
  p.avatar_url,
  p.cidade,
  public.normalizar_texto(p.cidade) as cidade_normalizada,
  coalesce(c.categorias, '[]'::jsonb) as categorias,
  a.nota_media,
  coalesce(a.total_avaliacoes, 0) as total_avaliacoes
from public.perfis p
left join lateral (
  select jsonb_agg(jsonb_build_object('id', cs.id, 'nome', cs.nome) order by cs.nome) as categorias
  from public.servicos_prestadora sp
  join public.categorias_servico cs on cs.id = sp.categoria_id
  where sp.prestadora_id = p.id
) c on true
left join lateral (
  select round(avg(av.nota), 1) as nota_media, count(*)::int as total_avaliacoes
  from public.avaliacoes av
  where av.prestadora_id = p.id
) a on true
where p.papel = 'prestadora';

grant select on public.prestadoras_resumo to anon, authenticated;
