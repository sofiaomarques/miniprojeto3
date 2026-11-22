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

### Stack: Next.js + Supabase + Vercel

- **Escolha:** front em Next.js 15 (App Router), Supabase como backend
  (Postgres, Auth e Storage) e deploy na Vercel (Root Directory `frontend`,
  produção na `main`).
- **Por quê:** o Supabase dá banco, autenticação e arquivos prontos, sem servidor
  próprio para manter, e a Vercel publica o Next sem configuração extra. O time
  foca nas features em vez da infraestrutura.
- **Como integra:** `frontend/lib/supabase/client.ts` (navegador) e
  `frontend/lib/supabase/server.ts` (servidor, com `cookies()` do Next) usam
  `@supabase/ssr` e só a chave publishable (`NEXT_PUBLIC_SUPABASE_*`).

## Uso de IA

Ferramenta e para quê. Exemplo: "Claude para gerar o seed de 200 posts sobre
corrida; o resto foi escrito pelo time."

- **Claude (Claude Code):** implementou a integração com o Supabase da issue #11
  (`lib/supabase/client.ts`, `lib/supabase/server.ts`, `.env.local.example`) e
  validou build e conexão; revisado pela Pessoa 1.
