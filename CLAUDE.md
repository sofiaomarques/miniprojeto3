# CLAUDE.md

## Visão geral
Rede social de nicho (Mini-projeto 3): conecta **prestadoras de serviços de casa**
(ar-condicionado, elétrica, encanamento…) a **clientes**, com busca, avaliações e chat.
Stack: Next.js 15 + React 19 + TypeScript + Tailwind 4, com Supabase (Auth, Postgres, Storage).
Três áreas, uma pessoa por área: **P1** identidade, **P2** descoberta, **P3** chat.

## Estrutura
- `frontend/app/` rotas. `(auth)/` cadastro, login e onboarding; `buscar`, `prestadoras/[id]`, `chat`
- `frontend/components/` peças de tela, por área (`ui`, `identidade`, `descoberta`, `chat`)
- `frontend/lib/` regras e acesso a dados, por área (`identidade`, `descoberta`, `chat`, `supabase`)
- `frontend/middleware.ts` renova a sessão do Supabase
- `supabase/migrations/` SQL numerado (01 identidade, 02 descoberta, 03 chat)
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
- Cada área tem um `service.ts` que escolhe entre `service-mock.ts` e `service-supabase.ts`.
  As telas importam **só** do `service.ts`. Páginas finas: só compõem componentes.
- Tipos de perfil vêm de `lib/identidade/types.ts`: não redefinir.
- Erros viram mensagens fixas em português; nunca mostrar a mensagem crua do banco.
- Git: uma branch por issue (`p1/NN-nome`), PR com `Closes #N`, revisado por outra pessoa,
  commits pequenos explicando o porquê. Não subir código morto.

## Notas importantes
- **Node 22 ou mais novo.**
- `frontend/.env.local` (fora do git): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_USE_MOCKS` (`true` = dados de mentira,
  ignorado em produção). **Nunca** usar a chave secret/service_role no frontend.
- A segurança dos dados está na **RLS do banco**, não nas telas nem no middleware.
- Migrations são aplicadas **à mão** no Supabase compartilhado, em ordem (01 → 02 → 03).
- Pasta dentro do OneDrive quebra o Git (`cannot stat 'frontend'`) e o Next (`EINVAL .next`):
  trabalhe fora dele.
- Perfis de cliente só são legíveis pela própria dona (RLS da 01); quem precisar ler outros
  perfis cria policy própria na migration.
