-- 01_identidade.sql — identidade, perfis e portfólio (Pessoa 1).
--
-- Contrato usado pelas outras migrations (ex.: 02_descoberta.sql):
--   perfis(id uuid = auth.users.id, papel 'cliente' | 'prestadora' | null,
--          nome, avatar_url, bio, cidade)
--   categorias_servico(id bigint, nome)
--   servicos_prestadora(prestadora_id uuid, categoria_id bigint)
--   fotos_portfolio(id bigint, prestadora_id uuid, caminho)
--   bucket de Storage 'portfolio', arquivos em '<id da dona>/<arquivo>'
--
-- Segurança:
--   * nenhum SQL dinâmico (sem EXECUTE/format); toda função tem
--     search_path vazio e nomes qualificados com o schema;
--   * RLS ligado em todas as tabelas; anon só lê;
--   * GRANTs mínimos por tabela e por coluna (o Supabase dá ALL por padrão
--     para anon e authenticated; aqui isso é revogado e refeito);
--   * papel nasce null e é escolhido uma única vez no onboarding (#14);
--     metadados do cadastro nunca definem papel.
--
-- Fora do escopo (issue #17): limite de frequência de upload, validação do
-- conteúdo real da imagem e validação de formulário.

-- ===========================================================================
-- perfis: uma linha por conta do Supabase Auth
-- ===========================================================================
create table public.perfis (
  id            uuid primary key references auth.users (id) on delete cascade,
  -- null até o onboarding (#14) escolher; depois disso não muda pelo app.
  papel         text check (papel in ('cliente', 'prestadora')),
  nome          text check (char_length(btrim(nome)) between 1 and 80),
  avatar_url    text check (
                  char_length(avatar_url) <= 2048
                  and avatar_url ~ '^https?://'
                ),
  bio           text check (char_length(bio) <= 500),
  cidade        text check (char_length(btrim(cidade)) between 1 and 100),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  -- quem já escolheu papel aparece na busca, então precisa de nome.
  constraint perfis_nome_obrigatorio_com_papel
    check (papel is null or nome is not null)
);

create index perfis_papel_idx on public.perfis (papel);

-- Diz se um perfil é prestadora. SECURITY DEFINER para as policies não
-- dependerem da RLS de perfis; só lê, não recebe SQL, não monta SQL.
create function public.eh_prestadora(perfil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis p
    where p.id = perfil_id
      and p.papel = 'prestadora'
  );
$$;

-- Campos protegidos: id e criado_em nunca mudam pelo app; papel só pode sair
-- de null para um valor válido, uma vez. service_role/postgres (admin) podem.
create function public.perfis_proteger_campos()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if new.id is distinct from old.id then
      raise exception 'id do perfil não pode ser alterado'
        using errcode = '42501';
    end if;

    if new.criado_em is distinct from old.criado_em then
      raise exception 'criado_em não pode ser alterado'
        using errcode = '42501';
    end if;

    if old.papel is not null and new.papel is distinct from old.papel then
      raise exception 'papel já foi definido e não pode ser alterado'
        using errcode = '42501';
    end if;
  end if;

  new.atualizado_em := now();
  return new;
end;
$$;

create trigger perfis_proteger_campos
  before update on public.perfis
  for each row execute function public.perfis_proteger_campos();

-- Cria o perfil quando uma conta nasce no Auth. Só o nome vem dos metadados
-- (texto livre, sem privilégio, cortado em 80 caracteres). Papel fica null.
create function public.criar_perfil_nova_usuaria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome)
  values (
    new.id,
    nullif(btrim(left(btrim(new.raw_user_meta_data ->> 'nome'), 80)), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger criar_perfil_ao_cadastrar
  after insert on auth.users
  for each row execute function public.criar_perfil_nova_usuaria();

alter table public.perfis enable row level security;

-- Só prestadoras são públicas (vitrine/busca). Clientes e contas sem papel
-- só enxergam o próprio perfil; quem precisar ver cliente (ex.: prestadora
-- vendo quem pediu um serviço) cria policy própria na migration dela.
create policy perfis_leitura_publica on public.perfis
  for select to anon, authenticated
  using (papel = 'prestadora' or id = (select auth.uid()));

create policy perfis_update_da_dona on public.perfis
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Sem policy de insert/delete: o perfil nasce pelo trigger e morre junto
-- com a conta (on delete cascade).

-- ===========================================================================
-- categorias_servico: catálogo fixo, só leitura para o app
-- ===========================================================================
create table public.categorias_servico (
  id   bigint generated always as identity primary key,
  nome text not null unique check (char_length(btrim(nome)) between 1 and 60)
);

insert into public.categorias_servico (nome) values
  ('Ar-condicionado'),
  ('Elétrica'),
  ('Encanamento'),
  ('Montagem de móveis'),
  ('Pintura'),
  ('Pequenos reparos'),
  ('Instalação de eletrodomésticos'),
  ('Jardinagem');

alter table public.categorias_servico enable row level security;

create policy categorias_leitura_publica on public.categorias_servico
  for select to anon, authenticated
  using (true);

-- ===========================================================================
-- servicos_prestadora: prestadora × categoria
-- ===========================================================================
create table public.servicos_prestadora (
  prestadora_id uuid   not null references public.perfis (id) on delete cascade,
  -- restrict: apagar uma categoria em uso exige decisão explícita do admin.
  categoria_id  bigint not null references public.categorias_servico (id) on delete restrict,
  criado_em     timestamptz not null default now(),
  primary key (prestadora_id, categoria_id)
);

create index servicos_prestadora_categoria_id_idx
  on public.servicos_prestadora (categoria_id);

-- ===========================================================================
-- fotos_portfolio: só o caminho no Storage; o arquivo fica no bucket
-- ===========================================================================
create table public.fotos_portfolio (
  id            bigint generated always as identity primary key,
  prestadora_id uuid not null references public.perfis (id) on delete cascade,
  -- '<prestadora_id>/<arquivo>', um nível só, igual ao caminho no bucket.
  caminho       text not null unique,
  criada_em     timestamptz not null default now(),
  constraint fotos_portfolio_caminho_valido check (
    char_length(caminho) <= 512
    and caminho ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+$'
    and caminho !~ '/\.\.?$'
    and split_part(caminho, '/', 1) = prestadora_id::text
  )
);

create index fotos_portfolio_prestadora_id_idx
  on public.fotos_portfolio (prestadora_id);

-- Integridade para qualquer papel (inclusive admin): serviços e fotos só
-- podem apontar para um perfil de prestadora. CHECK não cruza tabelas.
create function public.exigir_prestadora()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.eh_prestadora(new.prestadora_id) then
    raise exception 'perfil % não é prestadora', new.prestadora_id
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger servicos_prestadora_exigir_prestadora
  before insert or update on public.servicos_prestadora
  for each row execute function public.exigir_prestadora();

create trigger fotos_portfolio_exigir_prestadora
  before insert or update on public.fotos_portfolio
  for each row execute function public.exigir_prestadora();

alter table public.servicos_prestadora enable row level security;
alter table public.fotos_portfolio enable row level security;

create policy servicos_leitura_publica on public.servicos_prestadora
  for select to anon, authenticated
  using (true);

create policy servicos_insert_da_prestadora on public.servicos_prestadora
  for insert to authenticated
  with check (
    prestadora_id = (select auth.uid())
    and public.eh_prestadora((select auth.uid()))
  );

create policy servicos_delete_da_dona on public.servicos_prestadora
  for delete to authenticated
  using (prestadora_id = (select auth.uid()));

create policy fotos_leitura_publica on public.fotos_portfolio
  for select to anon, authenticated
  using (true);

create policy fotos_insert_da_prestadora on public.fotos_portfolio
  for insert to authenticated
  with check (
    prestadora_id = (select auth.uid())
    and public.eh_prestadora((select auth.uid()))
  );

create policy fotos_delete_da_dona on public.fotos_portfolio
  for delete to authenticated
  using (prestadora_id = (select auth.uid()));

-- Sem update em serviços e fotos: troca é apagar e inserir de novo.

-- ===========================================================================
-- Privilégios mínimos (a RLS filtra linhas; o GRANT limita operações/colunas)
-- ===========================================================================
revoke all on table public.perfis              from anon, authenticated;
revoke all on table public.categorias_servico  from anon, authenticated;
revoke all on table public.servicos_prestadora from anon, authenticated;
revoke all on table public.fotos_portfolio     from anon, authenticated;

grant select on table public.perfis              to anon, authenticated;
grant select on table public.categorias_servico  to anon, authenticated;
grant select on table public.servicos_prestadora to anon, authenticated;
grant select on table public.fotos_portfolio     to anon, authenticated;

grant update (nome, avatar_url, bio, cidade, papel) on table public.perfis to authenticated;
grant insert, delete on table public.servicos_prestadora to authenticated;
grant insert (prestadora_id, caminho), delete on table public.fotos_portfolio to authenticated;

-- Funções: ninguém chama os triggers por fora; eh_prestadora só para
-- authenticated (é usada nas policies de escrita).
revoke all on function public.criar_perfil_nova_usuaria() from public, anon, authenticated;
revoke all on function public.perfis_proteger_campos()    from public, anon, authenticated;
revoke all on function public.exigir_prestadora()         from public, anon, authenticated;
revoke all on function public.eh_prestadora(uuid)         from public, anon;
grant execute on function public.eh_prestadora(uuid) to authenticated;

-- ===========================================================================
-- Storage: bucket 'portfolio'
-- ===========================================================================
-- Público: a imagem abre pela URL pública sem login. Limites aplicados pelo
-- próprio Storage: 5 MB por arquivo e só JPEG, PNG e WebP. Sem limite de
-- quantidade de arquivos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio',
  'portfolio',
  true,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Upload: só prestadora autenticada, só na própria pasta, um nível só.
create policy portfolio_insert_da_prestadora on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'portfolio'
    and array_length(storage.foldername(name), 1) = 1
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.eh_prestadora((select auth.uid()))
  );

-- SELECT via API só na própria pasta (o Storage exige SELECT para apagar).
-- A leitura pública das imagens vem do bucket público (URL pública), sem
-- liberar listagem do bucket inteiro.
create policy portfolio_select_da_dona on storage.objects
  for select to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy portfolio_delete_da_dona on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Sem policy de UPDATE: ninguém sobrescreve nem move arquivo (upsert: false).
--
-- ATENÇÃO (limpeza): o banco não apaga arquivos do Storage. Apagar uma linha
-- de fotos_portfolio, ou a conta (cascade), deixa o arquivo no bucket público.
-- Contrato para o app: apagar o objeto pela API do Storage ANTES de apagar a
-- linha da foto, e antes de excluir a conta (Edge Function com service_role
-- remove a pasta '<id>/'). Pendente de implementação no app (issue #17).
