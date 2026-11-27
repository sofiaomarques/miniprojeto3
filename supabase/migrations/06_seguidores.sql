-- 06_seguidores.sql — seguir pessoas: seguidores e seguindo.
-- Roda depois da 01 (perfis) e da 02 (normalizar_texto).
--
-- Qualquer conta que já escolheu papel (cliente ou prestadora) segue qualquer
-- outra conta com papel: a cliente segue as amigas para ver as indicações
-- delas, e a prestadora junta a rede de clientes que a acompanham.
--
-- Quem vê o quê:
--   * contar_seguidores(): números de seguidores e seguindo de qualquer
--     perfil, também para anon (aparecem na página pública da prestadora);
--   * listas e nomes: só para quem está logada. Na 01 o perfil de uma
--     cliente só é visível para a dona; a view `pessoas_publicas` expõe SÓ
--     nome, avatar e papel de quem tem papel. Bio e cidade da cliente
--     continuam privadas (mesma escolha da `avaliacoes_publicas` da 02).
--
-- Segurança (mesmo padrão da 01): funções com search_path vazio, RLS ligado,
-- GRANTs mínimos por coluna. Só a própria conta segue e deixa de seguir em
-- nome dela; ninguém segue a si mesma; não há update (seguir de novo é
-- apagar e inserir).

-- ===========================================================================
-- Tabela
-- ===========================================================================
create table public.seguidores (
  seguidora_id uuid not null references public.perfis (id) on delete cascade,
  seguida_id   uuid not null references public.perfis (id) on delete cascade,
  criado_em    timestamptz not null default now(),
  primary key (seguidora_id, seguida_id),
  constraint seguidores_nao_segue_a_si_mesma check (seguidora_id <> seguida_id)
);

-- seguidora_id já é coberto pela chave primária; este cobre "quem me segue".
create index seguidores_seguida_id_idx on public.seguidores (seguida_id, criado_em desc);

-- Diz se um perfil já escolheu papel (fez o onboarding). SECURITY DEFINER
-- para a policy não depender da RLS de perfis (cliente não é pública).
create function public.tem_papel(perfil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis p
    where p.id = perfil_id and p.papel is not null
  );
$$;

revoke all on function public.tem_papel(uuid) from public, anon;
grant execute on function public.tem_papel(uuid) to authenticated;

alter table public.seguidores enable row level security;

-- Quem segue quem é público para quem está logada (é o que a rede mostra).
create policy seguidores_leitura_logada on public.seguidores
  for select to authenticated
  using (true);

-- Só segue em nome próprio, e as duas pontas precisam ter papel.
create policy seguidores_insert_da_seguidora on public.seguidores
  for insert to authenticated
  with check (
    seguidora_id = (select auth.uid())
    and public.tem_papel((select auth.uid()))
    and public.tem_papel(seguida_id)
  );

-- Só quem segue deixa de seguir (tirar seguidora não faz parte desta versão).
create policy seguidores_delete_da_seguidora on public.seguidores
  for delete to authenticated
  using (seguidora_id = (select auth.uid()));

revoke all on table public.seguidores from anon, authenticated;
grant select on table public.seguidores to authenticated;
grant insert (seguidora_id, seguida_id) on table public.seguidores to authenticated;
grant delete on table public.seguidores to authenticated;
