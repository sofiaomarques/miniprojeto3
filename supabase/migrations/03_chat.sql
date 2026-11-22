-- 03_chat.sql — chat entre cliente e prestadora (Pessoa 3).
--
-- Depende só da 01_identidade.sql, que fornece:
--   perfis(id uuid, papel 'cliente' | 'prestadora' | null, nome, avatar_url)
--   eh_prestadora(perfil_id uuid)
-- A ordem de aplicação combinada continua 01, 02, 03.
--
-- Regras:
--   * uma conversa por par cliente/prestadora, criada só por iniciar_conversa();
--   * só as duas participantes leem a conversa e as mensagens;
--   * só a autora insere mensagem, em nome próprio, numa conversa dela;
--   * ninguém edita nem apaga mensagem; lida_em só muda por marcar_lidas().
--
-- Segurança (mesmo padrão da 01):
--   * toda função tem search_path vazio e nomes qualificados com o schema;
--   * RLS ligado nas duas tabelas;
--   * GRANTs mínimos: o Supabase dá ALL para anon e authenticated por
--     padrão; aqui isso é revogado e refeito. O insert de mensagens é por
--     coluna, então o app não escolhe criada_em nem lida_em. O seed
--     (postgres) pode, para montar conversas com histórico.

-- ===========================================================================
-- Tabelas
-- ===========================================================================
create table public.conversas (
  id                 bigint generated always as identity primary key,
  cliente_id         uuid not null references public.perfis (id) on delete cascade,
  prestadora_id      uuid not null references public.perfis (id) on delete cascade,
  criada_em          timestamptz not null default now(),
  ultima_mensagem_em timestamptz,
  constraint conversas_par_unico unique (cliente_id, prestadora_id),
  check (cliente_id <> prestadora_id)
);

-- cliente_id já é coberto pelo índice do UNIQUE.
create index conversas_prestadora_id_idx on public.conversas (prestadora_id);

create table public.mensagens (
  id          bigint generated always as identity primary key,
  conversa_id bigint not null references public.conversas (id) on delete cascade,
  autor_id    uuid not null references public.perfis (id) on delete cascade,
  -- limite no tamanho real; vazio = só espaços, tabs ou quebras de linha.
  texto       text not null check (
                char_length(texto) <= 2000
                and btrim(texto, E' \t\r\n') <> ''
              ),
  criada_em   timestamptz not null default now(),
  lida_em     timestamptz
);

create index mensagens_conversa_criada_idx on public.mensagens (conversa_id, criada_em);
create index mensagens_nao_lidas_idx on public.mensagens (conversa_id) where lida_em is null;

-- ===========================================================================
-- Funções auxiliares
-- ===========================================================================
-- Diz se a usuária logada participa da conversa. SECURITY DEFINER para a
-- RLS de mensagens não depender da RLS de conversas.
create function public.participa_da_conversa(conversa_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversas c
    where c.id = participa_da_conversa.conversa_id
      and (select auth.uid()) in (c.cliente_id, c.prestadora_id)
  );
$$;

-- Mantém a lista de conversas ordenada pela mais recente. greatest() evita
-- voltar no tempo quando o seed insere mensagens fora de ordem.
-- SECURITY DEFINER: conversas não tem policy nem grant de update.
create function public.conversas_atualizar_ultima_mensagem()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversas
  set ultima_mensagem_em = greatest(ultima_mensagem_em, new.criada_em)
  where id = new.conversa_id;
  return null;
end;
$$;

create trigger mensagens_depois_de_inserir
  after insert on public.mensagens
  for each row execute function public.conversas_atualizar_ultima_mensagem();

-- ===========================================================================
-- RLS
-- ===========================================================================
alter table public.conversas enable row level security;
alter table public.mensagens enable row level security;

create policy conversas_leitura_das_participantes on public.conversas
  for select to authenticated
  using ((select auth.uid()) in (cliente_id, prestadora_id));

-- Sem policy de insert/update/delete em conversas: só iniciar_conversa() cria.

create policy mensagens_leitura_das_participantes on public.mensagens
  for select to authenticated
  using (public.participa_da_conversa(conversa_id));

create policy mensagens_insert_da_autora on public.mensagens
  for insert to authenticated
  with check (
    autor_id = (select auth.uid())
    and public.participa_da_conversa(conversa_id)
  );

-- Sem policy de update/delete em mensagens: só marcar_lidas() muda lida_em.

-- ===========================================================================
-- RPCs
-- ===========================================================================
-- Devolve a conversa da cliente logada com a prestadora, criando se não existir.
-- Chamada do front: supabase.rpc('iniciar_conversa', { prestadora_id })
create function public.iniciar_conversa(prestadora_id uuid)
returns public.conversas
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cliente  uuid := (select auth.uid());
  v_conversa public.conversas;
begin
  if v_cliente is null then
    raise exception 'É preciso estar logada para conversar.'
      using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.perfis p
    where p.id = v_cliente and p.papel = 'cliente'
  ) then
    raise exception 'Só clientes podem iniciar uma conversa.'
      using errcode = '42501';
  end if;

  if not public.eh_prestadora(iniciar_conversa.prestadora_id) then
    raise exception 'Prestadora não encontrada.'
      using errcode = 'P0002';
  end if;

  insert into public.conversas (cliente_id, prestadora_id)
  values (v_cliente, iniciar_conversa.prestadora_id)
  on conflict on constraint conversas_par_unico do nothing;

  select c.* into v_conversa
  from public.conversas c
  where c.cliente_id = v_cliente
    and c.prestadora_id = iniciar_conversa.prestadora_id;

  return v_conversa;
end;
$$;

-- Marca como lidas as mensagens recebidas na conversa. Devolve quantas marcou.
-- Chamada do front: supabase.rpc('marcar_lidas', { conversa_id })
create function public.marcar_lidas(conversa_id bigint)
returns integer
language sql
volatile
security definer
set search_path = ''
as $$
  with marcadas as (
    update public.mensagens m
    set lida_em = now()
    where m.conversa_id = marcar_lidas.conversa_id
      and m.autor_id <> (select auth.uid())
      and m.lida_em is null
      and public.participa_da_conversa(m.conversa_id)
    returning 1
  )
  select count(*)::int from marcadas;
$$;

-- Total de mensagens não lidas da usuária logada (para o <UnreadBadge />).
-- SECURITY INVOKER: a RLS de mensagens já limita às conversas dela.
-- Chamada do front: supabase.rpc('nao_lidas')
create function public.nao_lidas()
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::int
  from public.mensagens m
  where m.autor_id <> (select auth.uid())
    and m.lida_em is null;
$$;

-- ===========================================================================
-- Lista de conversas: uma linha por conversa da usuária logada
--   outra_*: a outra participante (nome e avatar na lista)
--   ultima_mensagem_*: prévia na lista
--   nao_lidas: mensagens recebidas ainda não lidas nesta conversa
-- security_invoker: a view respeita a RLS de conversas, mensagens e perfis.
-- ===========================================================================
create view public.conversas_resumo
with (security_invoker = true) as
select
  c.id,
  c.cliente_id,
  c.prestadora_id,
  c.criada_em,
  c.ultima_mensagem_em,
  outra.id         as outra_id,
  outra.nome       as outra_nome,
  outra.avatar_url as outra_avatar_url,
  outra.papel      as outra_papel,
  u.texto          as ultima_mensagem_texto,
  u.autor_id       as ultima_mensagem_autor_id,
  coalesce(n.nao_lidas, 0) as nao_lidas
from public.conversas c
join public.perfis outra
  on outra.id = case when c.cliente_id = (select auth.uid())
                     then c.prestadora_id else c.cliente_id end
left join lateral (
  select m.texto, m.autor_id
  from public.mensagens m
  where m.conversa_id = c.id
  order by m.criada_em desc, m.id desc
  limit 1
) u on true
left join lateral (
  select count(*)::int as nao_lidas
  from public.mensagens m
  where m.conversa_id = c.id
    and m.autor_id <> (select auth.uid())
    and m.lida_em is null
) n on true;

-- ===========================================================================
-- GRANTs mínimos
-- ===========================================================================
revoke all on table public.conversas        from anon, authenticated;
revoke all on table public.mensagens        from anon, authenticated;
revoke all on table public.conversas_resumo from anon, authenticated;

grant select on table public.conversas        to authenticated;
grant select on table public.mensagens        to authenticated;
grant select on table public.conversas_resumo to authenticated;
grant insert (conversa_id, autor_id, texto) on table public.mensagens to authenticated;

-- Funções: o trigger não é chamado por fora; as RPCs só para quem está logada.
revoke all on function public.conversas_atualizar_ultima_mensagem() from public, anon, authenticated;
revoke all on function public.participa_da_conversa(bigint) from public, anon;
revoke all on function public.iniciar_conversa(uuid)        from public, anon;
revoke all on function public.marcar_lidas(bigint)          from public, anon;
revoke all on function public.nao_lidas()                   from public, anon;
grant execute on function public.participa_da_conversa(bigint) to authenticated;
grant execute on function public.iniciar_conversa(uuid)        to authenticated;
grant execute on function public.marcar_lidas(bigint)          to authenticated;
grant execute on function public.nao_lidas()                   to authenticated;

-- ===========================================================================
-- Realtime (respeita a RLS de select de cada tabela)
--   mensagens INSERT: mensagem nova na conversa aberta e no badge;
--   mensagens UPDATE: lida_em mudou (badge em outra aba ou dispositivo);
--   conversas INSERT/UPDATE: conversa nova ou com mensagem nova na lista,
--     inclusive a conversa recém-criada aparecendo para a prestadora.
-- ===========================================================================
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.mensagens, public.conversas;
  end if;
end;
$$;
