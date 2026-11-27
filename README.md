# Mini-projeto 3: rede social de nicho

Cada time constrói uma rede social para uma comunidade que escolhe (música,
corrida, leitura, jogos da atlética...). A turma tem 7 times: 4 de 4 pessoas e
3 de 3. A stack é FastAPI + SQLAlchemy + SQLite no backend e Next.js +
TypeScript + Tailwind no frontend. Todos partem do mesmo ponto: um exemplo que
já funciona, só de usuários (do banco até a tela), e a lista de testes do
núcleo, que cada time implementa. Depois do núcleo, o catálogo traz ideias de
features, e cada time escolhe as que fazem sentido para o seu nicho. O projeto
é um exercício para treinar o senso de produto, então cada rede acaba
diferente da outra.

Este é o treino final antes do hackathon de novembro.

## O que ler

| Documento | Para quê |
|---|---|
| [RUBRICA.md](RUBRICA.md) | Como vamos avaliar. Leiam hoje. |
| [CATALOGO.md](CATALOGO.md) | Ideias de features para escolher. |
| [CONTRATO.md](CONTRATO.md) | Sugestão de rotas, campos e status para as ideias do catálogo. |
| [DECISIONS.md](DECISIONS.md) | O que o time preenche: produto, decisões, features, uso de IA. |
| [docs/guias/](docs/guias/) | Setup, autenticação, git em equipe, deploy e outros. |

## Como começar

Este projeto não usa o backend FastAPI do modelo (`backend/`): o front fala
direto com o Supabase, e a RLS do banco protege os dados (ver a seção Deploy
do [DECISIONS.md](DECISIONS.md)). Por isso `make check`, `make dev-back`, `make seed` e
`make test` não se aplicam.

Instalem as dependências uma vez (Node 22 ou mais novo):

```bash
cd frontend && npm install && cp .env.local.example .env.local && cd ..
```

No `frontend/.env.local`, preencham `NEXT_PUBLIC_SUPABASE_URL` e
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, ou usem `NEXT_PUBLIC_USE_MOCKS=true`
para rodar com dados de mentira.

Depois validem o ambiente:

```bash
cd frontend && npm test && npx tsc --noEmit && cd ..
```

Para rodar o projeto:

```bash
make dev-front  # site em localhost:3000
```

Se algum comando falhar, vejam o [guia 00](docs/guias/00-setup.md).

## Dados de demonstração

O `supabase/seed-demo.sql` cria contas fixas, perfis, serviços, avaliações e
conversas em João Pessoa, para testar e apresentar o site. Rodem no Supabase
de **desenvolvimento**, depois das migrations 01, 02 e 03, pelo SQL Editor ou
com `psql "$DATABASE_URL" -f supabase/seed-demo.sql`. Pode rodar de novo: ele
refaz serviços, avaliações e conversas destas contas e volta a senha para a
de baixo, sem apagar as fotos e o avatar enviados pelo site. Não mexe em
nenhuma outra conta.

Todas as contas usam a senha **`demo12345`**:

| E-mail | Conta | O que tem |
|---|---|---|
| `marina@demo.test` | Prestadora (ar-condicionado) | 2 avaliações (média 4,5) e 2 conversas, 3 mensagens não lidas |
| `camila@demo.test` | Prestadora (encanamento) | 1 avaliação e 1 conversa |
| `joana@demo.test` | Prestadora (montagem de móveis) | 1 avaliação e 1 conversa |
| `aline@demo.test` | Prestadora (elétrica) | 1 avaliação, sem conversas |
| `beatriz@demo.test` | Cliente | 3 avaliações feitas e 2 conversas, 1 não lida |
| `fernanda@demo.test` | Cliente | 2 avaliações feitas e 2 conversas |

As fotos do portfólio não estão no seed (o SQL não envia arquivos para o
Storage): enviem pelo próprio site, entrando como a prestadora.

O repositório é público e a senha está aqui, então qualquer pessoa pode
entrar nessas contas. Se alguém mudar um perfil, apagar uma avaliação ou
trocar a senha, é só rodar o seed de novo: ele também desloga quem
estiver nessas contas.

## Primeiros passos do time

1. Leiam o código existente (Supabase em `frontend/lib/supabase`). Toda feature
   nova segue o mesmo caminho.
2. Escolham o nicho e comecem a seção Produto e a tabela de donos no
   [DECISIONS.md](DECISIONS.md). Não precisa ficar pronto agora: o arquivo muda
   junto com o projeto.
3. Abram uma issue por feature (há um template). O PR que entrega a feature
   fecha a issue com `Closes #N`.
4. Façam o núcleo antes do menu. Divisão de trabalho sugerida: [guia 07](docs/guias/07-organizacao-do-time.md).

## Os testes do núcleo

Os testes de `backend/tests/test_nucleo.py` são um roteiro. Um teste `skipped`
é uma tarefa que ainda falta: removam o `@skip`, vejam o teste falhar e
implementem até passar. Eles ajudam o time, mas não valem nota.

## Estruturas de dados

Quando fizer sentido, guardem a lógica de uma feature numa estrutura de dados
em `backend/app/core/`, em Python puro, e façam o endpoint usá-la. Usem
`core/contadores.py` como modelo. Isso conta no critério de organização do
código, e a estrutura escolhida vale uma boa explicação no `DECISIONS.md`.

## Uso de IA

IA é permitida. Registrem no `DECISIONS.md` onde e como vocês a usaram.

## Prazos

| Marco | Data |
|---|---|
| Início | segunda, 16/11/2026 |
| Entrega final | sexta, 27/11/2026 |

## Guias

Os guias ficam em `docs/guias/`: 00 setup, 01 autenticação (comecem por aqui),
02 git em equipe, 03 boas práticas, 04 erros clássicos, 05 JWT (opcional),
06 upload, 07 organização do time, 08 deploy, 09 escrever um teste seu (opcional), 10 do zero ao
esqueleto. Para ideias com estrutura de dados, vejam `docs/estruturas/` (grafos,
árvores, heaps e tries).
