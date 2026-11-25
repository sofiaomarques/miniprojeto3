# Decisões do time

**Time:** _(nomes e usernames do GitHub)_

Este arquivo acompanha o projeto. Comecem com o que já sabem e atualizem quando
as decisões mudarem.

## Produto

Respondam antes de escolher features. O pitch sai daqui.

- **Público:** _(quem usa a rede, o mais específico possível: "corredores
  iniciantes da UFPB", não "pessoas que gostam de esporte")_
- **Problema:** _(o que essa pessoa tenta fazer hoje e onde isso falha)_
- **Como a rede resolve:** _(uma ou duas frases)_
- **Como saberíamos que funcionou:** _(um sinal observável: "a pessoa volta
  no dia seguinte para ver o treino dos amigos")_

## Decisões de produto

Registrem de 3 a 5 escolhas que mudaram o que a rede é. Boas candidatas: por
que essas features e não outras, o que ficou de fora, como o seed e a interface
refletem o nicho. Uma delas vai para o vídeo.

### 1. _(título curto)_

- **Contexto:** _(o que estava em jogo)_
- **Opções:** _(o que vocês consideraram)_
- **Escolha:** _(o que fizeram)_
- **O que cortamos e por quê:** _(o custo da escolha)_

Exemplo:

> **Feed cronológico em vez de "Em alta"**
>
> - **Contexto:** a comunidade é de corredores que treinam juntos.
> - **Opções:** feed ranqueado por engajamento ou feed cronológico.
> - **Escolha:** cronológico, com stories do dia.
> - **O que cortamos e por quê:** o "Em alta". Quem abre o app quer ver o
>   treino de hoje dos amigos, não o post mais curtido da semana.

## Features

Listem as features que o time vai construir, quem é o dono de cada uma e por
que ela entra no produto. A lista muda junto com o projeto: acrescentem e
tirem linhas quando mudarem de ideia.

| Feature | Dono | Por quê (1 frase) |
|---|---|---|
| Auth (núcleo) | | |
| Posts (núcleo) | | |
| Feed (núcleo) | | |
| Perfil (núcleo) | | |
| Follow (núcleo) | | |
| Curtidas (núcleo) | | |
| Comentários (núcleo) | | |
| Seed fake (núcleo) | | |

## Uma escolha técnica

Contem uma escolha técnica que o time fez e por quê. Por exemplo, por que usou
uma estrutura de dados no `core/`, qual o Big O da operação principal, ou o
que mudaria se a rede crescesse 100 vezes. Se mediram com `make bench`, colem a
saída e uma frase dizendo o que os números mostram.

## Deploy

- **URL pública:** https://miniprojeto3-phi.vercel.app
- **Onde roda:** o front (Next) na Vercel, com Root Directory `frontend`. Auth,
  banco e arquivos ficam no Supabase.
- **Por que sem Render:** o guia 08 usa o Render para hospedar o backend
  FastAPI do modelo. Este projeto não usa esse backend: o front fala direto com
  o Supabase usando a chave publishable, e quem protege os dados é a RLS do
  banco. Sem servidor próprio, não há nada para subir no Render.
- **Variáveis na Vercel:** `NEXT_PUBLIC_SUPABASE_URL` e
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A `NEXT_PUBLIC_USE_MOCKS` é ignorada
  em produção, então a URL pública sempre usa o Supabase de verdade.
- **Para conferir:** cadastro → entrar → buscar prestadora → abrir o perfil →
  avaliar → chat.

## Testes de RLS

### Avaliações com duas contas (#28)

- **Arquivo:** `supabase/tests/database/02_descoberta.test.sql` (pgTAP, roda
  numa transação com rollback). Rodar com `supabase start && supabase test db`.
- **Contas:** clientes A e B, prestadoras P e Q, conta sem papel N.
  `auth.uid()` é simulado via `request.jwt.claims`, como o PostgREST faz.
- **Resultado (24/11):** 53/53 ok. Rodado em Postgres 16 local com pgTAP e um
  shim mínimo do Supabase (papéis `anon`/`authenticated`, `auth.uid()`); a
  `01_identidade.test.sql` passou 95/95 no mesmo ambiente.

| Tentativa | Resultado |
|---|---|
| A edita/apaga a avaliação de B | bloqueado pela RLS (0 linhas; conferido como admin) |
| A troca `cliente_id` da avaliação de B para si | `42501` (sem GRANT na coluna) |
| A insere avaliação com `cliente_id` de B | `42501` (policy de insert) |
| A avalia outra cliente, conta sem papel, perfil inexistente ou a si mesma | `42501` |
| Prestadora P avalia Q; conta sem papel N avalia P | `42501` |
| P cria 5 estrelas para si em nome de A | `42501` |
| P apaga/edita avaliações sobre ela | bloqueado pela RLS (0 linhas) |
| Segunda avaliação de A para P | `23505` (`UNIQUE`) |
| Nota 0, 6, 9 (no update) ou nula; comentário > 1000 caracteres | `23514` / `23502` |
| Forjar `criada_em` ou mover a avaliação para outra prestadora | `42501` (GRANT só em `nota` e `comentario`) |
| anon insere, edita, apaga ou chama `perfil_tem_papel` | `42501` |
| anon lê `avaliacoes`, `avaliacoes_publicas` e `prestadoras_resumo` | ok (média, total e busca por cidade sem acento conferidos) |
| anon lê perfis de clientes | 0 linhas; a view só expõe nome e avatar da autora |

Para garantir que o teste pega erro de verdade, afrouxamos as policies de
insert e delete numa cópia: 8 testes falharam, como esperado. Afrouxando as de
update e delete (`using (true)`), 13 falharam: as tentativas em linha alheia
usam `returning id` + `is_empty`, então falham na hora, e não só na conferência
como admin.

As contagens são filtradas pelas contas de teste: o teste continua passando se
o banco local já tiver contas e avaliações criadas usando o app.

## Uso de IA

Ferramenta e para quê. Exemplo: "Claude para gerar o seed de 200 posts sobre
corrida; o resto foi escrito pelo time."
