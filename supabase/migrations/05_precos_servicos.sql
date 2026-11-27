-- 05_precos_servicos.sql — preço base e negociação por serviço (Pessoa 1).
-- Roda depois da 01 (servicos_prestadora) e da 02. A 04 é a de avatares.
--
-- Cada linha de servicos_prestadora (prestadora × categoria) ganha:
--   preco_base      numeric(10,2), null = "a combinar"; em reais
--   aceita_negociar boolean, o aviso "aceito negociar este valor"
--
-- A 01 dizia "sem update em serviços: troca é apagar e inserir de novo".
-- Continua valendo para a categoria; esta migration libera UPDATE só nestas
-- duas colunas novas, só para a dona e só enquanto ela for prestadora (o
-- trigger exigir_prestadora da 01 já roda em update). Tirar um serviço
-- (delete) leva junto o preço dele.

alter table public.servicos_prestadora
  add column preco_base numeric(10, 2)
    constraint servicos_prestadora_preco_base_faixa
    check (preco_base is null or (preco_base > 0 and preco_base <= 99999.99)),
  add column aceita_negociar boolean not null default false;

-- Policy de update: a linha precisa ser da dona antes e depois do update.
-- Os GRANTs abaixo já impedem mexer em prestadora_id e categoria_id.
create policy servicos_update_da_dona on public.servicos_prestadora
  for update to authenticated
  using (prestadora_id = (select auth.uid()))
  with check (prestadora_id = (select auth.uid()));

-- A RLS filtra linhas, não colunas: o GRANT por coluna é o que limita o
-- update a preço e negociação. anon continua só com select (da 01).
-- O INSERT continua só com (prestadora_id, categoria_id), como na 01: o
-- serviço nasce "a combinar" e o preço entra depois, por update.
grant update (preco_base, aceita_negociar) on table public.servicos_prestadora to authenticated;
