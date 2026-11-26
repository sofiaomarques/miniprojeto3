# CLAUDE.md

## Visão geral
Rede social de nicho (Mini-projeto 3): conecta **prestadoras de serviços de casa**
(ar-condicionado, elétrica, encanamento…) a **clientes**, com busca, avaliações e chat.
Stack: Next.js 15 + React 19 + TypeScript + Tailwind 4, com Supabase (Auth, Postgres, Storage).
Três áreas, uma pessoa por área: **P1** identidade, **P2** descoberta, **P3** chat.

## Estrutura
- `frontend/app/` rotas, em grupos: `(auth)/` `cadastro`, `entrar`, `onboarding` e callback;
  `(rede)/` início (a busca), `prestadoras/[id]`, `perfil` (inclui as indicações da cliente),
  `avaliar/[id]`, `chat` e `chat/[id]`. `login`, `buscar`, `minhas-indicacoes` e
  `p/[slug]` são só redirects de links antigos: não recriar essas telas
- `frontend/components/` peças de tela, por área (`ui`, `rede`, `identidade`, `descoberta`, `chat`).
  Avatar é o de `components/descoberta/Avatar`
- `frontend/lib/` regras e acesso a dados, por área (`identidade`, `descoberta`, `chat`, `rede`,
  `supabase`). `lib/rede/sessao.ts` é a sessão das telas (Server Components)
- `frontend/middleware.ts` renova a sessão do Supabase
- `supabase/migrations/` SQL numerado (01 identidade, 02 descoberta). A 03 (chat) ainda não
  está na `main`, embora `lib/chat/service-supabase.ts` já use `mensagens` e `conversas_resumo`
- `supabase/tests/database/` testes pgTAP
- `backend/` FastAPI do modelo da disciplina. **Não é usado.**

## Comandos (rodar em `frontend/`)
- `npm install` · `npm run dev` (localhost:3000) · `npm run build`
- `npm test` (vitest) · `npx tsc --noEmit` (tipos)
- Antes de abrir PR: testes, tipos e build precisam passar.

## Antes de codar no frontend
Qualquer pedido para codar no `frontend/` segue esta ordem:
1. **Analisar primeiro se já existe.** Procurar a tela, componente, função ou rota na `main`
   (`git fetch` e ler `origin/main`), nos **PRs abertos** (`gh pr list`) e nas **issues**.
2. **Se já existe, não refazer nem sobrescrever.** Avisar a pessoa e dizer onde está
   (arquivo, PR ou branch).
3. **Se existe só num PR aberto**, avisar e esperar a decisão: não duplicar o trabalho
   de outra área (P1, P2 ou P3).
4. **Só depois, se não existe, começar a trabalhar**, em branch própria, sem mexer em
   arquivos de outra área sem avisar.

## Convenções
- Nomes em **português**; colunas do banco em `snake_case`.
- Cada área tem um `service.ts`, ponto único de acesso aos dados, que escolhe entre mock e
  Supabase. Em `descoberta` e `chat` eles ficam em `service-mock.ts` e `service-supabase.ts`;
  em `identidade` o mock está em `mocks.ts` e o acesso ao Supabase fica no próprio `service.ts`.
  As telas importam **só** do `service.ts`. Páginas finas: só compõem componentes.
- Tipos de perfil vêm de `lib/identidade/types.ts`: não redefinir.
- Erros viram mensagens fixas em português; nunca mostrar a mensagem crua do banco.
- Git: uma branch por issue (`pN/NN-nome`: p1, p2 ou p3 conforme a área), PR com `Closes #N`, revisado por outra pessoa,
  commits pequenos explicando o porquê. Não subir código morto.

## Notas importantes
- **Node 22 ou mais novo.**
- `frontend/.env.local` (fora do git): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_USE_MOCKS` (`true` = dados de mentira).
  A flag só é ignorada no deploy de produção da Vercel (`NEXT_PUBLIC_VERCEL_ENV=production`);
  em preview e em build local ela continua valendo. **Nunca** usar a chave secret/service_role no frontend.
- A segurança dos dados está na **RLS do banco**, não nas telas nem no middleware.
- Migrations são aplicadas **à mão** no Supabase compartilhado, em ordem (01 → 02; a 03, do chat, quando entrar).
- Pasta dentro do OneDrive quebra o Git (`cannot stat 'frontend'`) e o Next (`EINVAL .next`):
  trabalhe fora dele.
- Perfis de cliente só são legíveis pela própria dona (RLS da 01); quem precisar ler outros
  perfis cria policy própria na migration.
