-- 04_avatares.sql — foto de perfil (avatar) de qualquer conta (#18, Pessoa 1).
--
-- Por que uma migration nova: o bucket `portfolio` da 01 só aceita upload de
-- prestadora (eh_prestadora), e a #18 pede avatar também para a cliente. A 01
-- já está aplicada no Supabase compartilhado, então não é alterada.
--
-- Depende só da 01 (usa o Storage criado lá; não toca em perfis, que já tem
-- `avatar_url` e o GRANT de update dela para authenticated).
--
-- O link público do arquivo vai para perfis.avatar_url (o CHECK da 01 exige
-- http/https, que é o formato do link público do Storage).

-- ===========================================================================
-- Bucket 'avatares'
-- ===========================================================================
-- Público: o avatar abre pelo link sem login (aparece na busca, no chat e na
-- navbar). Limites aplicados pelo próprio Storage: 2 MB e só JPEG, PNG e WebP.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatares',
  'avatares',
  true,
  2 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Upload: qualquer conta autenticada (cliente, prestadora ou ainda sem papel),
-- só na própria pasta '<id>/<arquivo>', um nível só.
create policy avatares_insert_da_dona on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatares'
    and array_length(storage.foldername(name), 1) = 1
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- SELECT via API só na própria pasta (o Storage exige SELECT para apagar).
-- A leitura pública vem do bucket público, sem liberar listagem do bucket.
create policy avatares_select_da_dona on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy avatares_delete_da_dona on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Sem policy de UPDATE: trocar o avatar é subir um arquivo novo (nome
-- aleatório) e apagar o antigo. Assim o link antigo não mostra a foto nova
-- por causa de cache.
--
-- Limpeza ao excluir a conta: igual ao `portfolio` (issue #46), o banco não
-- apaga arquivos do Storage; a pasta '<id>/' precisa ser removida pelo app.
