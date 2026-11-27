# Guia 04: erros clássicos

Procurem a mensagem que estão vendo (Ctrl+F ajuda). Cada bloco traz a mensagem
literal, a causa e o conserto. Antes de tudo, leiam o traceback de baixo para
cima (guia 03, item 5).

> **Neste projeto:** o backend FastAPI do modelo não é usado (ver a seção
> Deploy do `DECISIONS.md`). O que este guia fala de `make dev-back`, `:8000`,
> Swagger e `NEXT_PUBLIC_API_URL` vale só para o modelo. Aqui o front fala
> direto com o Supabase: se uma chamada falhar, confiram
> `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no
> `frontend/.env.local`.

## Resumo

| Vocês veem | Vão para |
|---|---|
| `422 Unprocessable Entity` | [1](#1-422-no-post) |
| `blocked by CORS policy` no console | [2](#2-cors) |
| `useState only works in a Client Component` | [3](#3-use-client) |
| `TypeError: Failed to fetch` | [4](#4-failed-to-fetch) |
| `401 {"detail":"não autenticado"}` com login feito | [5](#5-401-com-login-feito) |
| deslogou sozinho no F5 | [6](#6-token-some-no-refresh) |
| `no such column` | [7](#7-no-such-column) |
| contador/estrutura do core/ zera sozinho | [8](#8-core-zerando) |
| conflito em `app.db` | [9](#9-conflito-binario) |
| `error reading bcrypt version` | [10](#10-bcrypt) |
| `ValueError: Invalid salt` (login dá 500) | [11](#11-invalid-salt) |
| `Unexpected end of JSON input` | [12](#12-resposta-sem-corpo) |

## 1. 422 no POST

```
POST /posts → 422
{"detail":[{"type":"missing","loc":["body","texto"],"msg":"Field required",...}]}
```

Causa: o corpo não bate com o schema. Falta um campo, o nome está errado, ou o
fetch foi sem `Content-Type: application/json` ou sem `JSON.stringify(body)`.

Conserto: o `loc` diz qual campo. No front, usem sempre um helper como o `apiPost()` do
bloco 3 do guia 10, que já põe o header e o stringify. Testem o endpoint sozinho no
Swagger (`:8000/docs`). Se funcionar lá, o problema está no fetch.

## 2. CORS

```
Access to fetch at 'http://localhost:8000/posts' from origin
'http://localhost:3000' has been blocked by CORS policy
```

Causa: quase nunca é CORS. O backend caiu ou a URL está errada, e o browser
reporta como CORS. O template já libera `localhost:3000`.

Conserto: olhem o terminal do `make dev-back` (está rodando? deu traceback?)
e o `NEXT_PUBLIC_API_URL` no `.env.local` (é `http://localhost:8000`?). Se
mudaram o `.env.local`, reiniciem o `make dev-front`.

## 3. use client

```
You're importing a component that needs `useState`. This React Hook only
works in a Client Component. To fix, mark the file (or its parent) with
the "use client" directive.
```

Causa: página com estado ou efeito sem `"use client"` na primeira linha.

Conserto: adicionem `"use client";` na primeira linha do arquivo, antes dos
imports.

## 4. failed to fetch

```
TypeError: Failed to fetch
```

Causa: backend fora do ar, porta errada, ou http e https trocados.

Conserto: rodem `curl localhost:8000/usuarios` num terminal. Se não responder,
subam com `make dev-back`. Se responder, confiram o `NEXT_PUBLIC_API_URL`.

## 5. 401 com login feito

```
GET /feed → 401 {"detail":"não autenticado"}
```

Causa: o token não está indo no request. O login foi feito, mas falta o Passo
4 do guia 01 (o `headers()` do helper de fetch que lê o `localStorage`).

Conserto: F12 → Network → cliquem no request e vejam se o header
`Authorization: Bearer ...` existe. Se não existe, façam o Passo 4. Se existe
e mesmo assim dá 401, o token não está na tabela `sessions` (o banco foi
apagado?). O helper de fetch (Passo 6 do guia 01) apaga esse token e manda para `/login`; é só
logar de novo.

## 6. token some no refresh

Sintoma: logado, aperta F5 e desloga.

Causa: o token está guardado em variável ou `useState`, e a memória do JS se
perde no reload.

Conserto: `localStorage.setItem("token", ...)` no login (guia 01, Passo 5) e
leitura no `headers()`. Confiram no console com
`localStorage.getItem("token")`.

## 7. no such column

```
sqlite3.OperationalError: no such column: users.password_hash
```

Causa: vocês mudaram um model, mas o `app.db` foi criado antes. O SQLite não
altera tabela sozinho (migração de verdade é com Alembic, fora do escopo).

Conserto:

```bash
rm backend/app.db && make seed
```

Perder o banco local não custa nada: o seed recria os dados.

## 8. core/ zerando

Sintoma: o contador ou a estrutura em `core/` volta a zero durante o
desenvolvimento.

Causa: `uvicorn --reload` reinicia o processo a cada arquivo salvo. O
singleton zera e é reconstruído do banco no startup. Se a estrutura não é
alimentada no startup, ela volta vazia.

Conserto: incluam a estrutura no rebuild do lifespan (`main.py`). O padrão
completo está em `backend/app/core/README.md`.

## 9. conflito binário

```
CONFLICT (content): Merge conflict in backend/app.db
warning: Cannot merge binary files
```

Causa: alguém commitou o banco.

Conserto: a receita está no guia 02, seção "Commitei o app.db":
`git rm --cached` e conferir o `.gitignore`. Não tentem resolver o conflito do
binário; apaguem o banco e rodem o seed de novo.

## 10. bcrypt

```
(trapped) error reading bcrypt version
AttributeError: module 'bcrypt' has no attribute '__about__'
```

Causa: incompatibilidade conhecida entre `passlib` e `bcrypt` moderno. Alguém
instalou o `passlib` por conta própria, seguindo algum tutorial.

Conserto: não usem passlib. O projeto fixa o `bcrypt` no `pyproject.toml` e o
guia 01 usa `bcrypt.hashpw`/`bcrypt.checkpw` direto. Removam o passlib com
`uv remove passlib` e sigam o guia 01, Passo 1.4.

## 11. invalid salt

```
POST /auth/login → 500
ValueError: Invalid salt
```

Causa: o usuário não tem senha. Quem veio do `POST /usuarios` do slice de
exemplo, ou de um seed sem `password_hash`, tem o hash vazio, e
`bcrypt.checkpw` com hash vazio explode em vez de devolver `False`.

Conserto: no login, tratem hash vazio como senha errada (`401`), e deem senha
aos usuários do seed. O código está no guia 01, Passos 1.2 e 2.3.

## 12. resposta sem corpo

```
SyntaxError: Unexpected end of JSON input
```

Sintoma: a ação funcionou (o follow aparece no Swagger), mas a tela mostra
erro.

Causa: a rota respondeu `204 No Content`, que não tem corpo, e o código chamou
`res.json()` mesmo assim. Acontece com follow, curtir, apagar e qualquer rota
`204`.

Conserto: usem um helper de fetch que já trate o `204` (como o `apiPost` do guia 10,
estendido com `apiPatch` e `apiDelete`). Se escreverem um `fetch` próprio (como no upload), confiram
`res.status === 204` antes de chamar `res.json()`.

---

Se o erro não está aqui, antes de chamar monitor: leiam o traceback de baixo
para cima, usem o Swagger para separar back de front e rodem `git diff` para
ver o que mudou desde o último estado que funcionava.
