# Guia 01: autenticação

Auth não vem pronta. O time faz o back e o front. Este guia já define o
desenho, e cada passo termina com um comando e a saída esperada.

O contrato está em `backend/tests/test_nucleo.py`: `test_auth_registro`, `test_auth_login`
e `test_auth_eu`. A implementação está pronta quando os três testes passam
e o login funciona pelo Swagger.

## O desenho

1. A senha nunca é guardada. Guardem o hash (bcrypt, já pinado no `pyproject.toml`).
2. O login troca a senha por um token opaco (string aleatória) salvo numa tabela `sessions`.
3. Toda request protegida manda `Authorization: Bearer <token>`. O `get_current_user`
   procura o token na tabela e devolve o `User`.
4. JWT fica para o guia 05, que é opcional. Token em tabela é mais simples de
   entender, depurar e revogar, e é auth de verdade.

---

## Passo 0: liberar o resto do time

Quase tudo depende de usuário logado, e ninguém deve esperar a auth ficar
pronta. Colem isto em `app/deps.py` no lugar do `NotImplementedError` e
entendam as 3 linhas do if antes de commitar:

```python
import os

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User


def get_current_user(
    x_user_id: int | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    # bypass de DESENVOLVIMENTO: só funciona com DEBUG=true.
    # Em produção não existe DEBUG: sem a auth real, rota protegida dá 401.
    if os.environ.get("DEBUG") == "true" and x_user_id is not None:
        user = db.get(User, x_user_id)
        if user:
            return user
    raise HTTPException(status_code=401, detail="não autenticado")
```

As 3 linhas do if:

1. o bypass só existe se a variável de ambiente `DEBUG` estiver ligada;
2. o header `X-User-Id` diz "finja que sou o usuário N";
3. se o usuário existe no banco, a rota o recebe como se estivesse logado.

Para verificar, colem esta rota temporária no fim de `app/routers/users.py`.
Apaguem no Passo 3, quando `/auth/eu` a substituir:

```python
from fastapi import Depends
from app.deps import get_current_user

@router.get("/eu-temporario")
def quem_sou(user=Depends(get_current_user)):
    return {"id": user.id, "username": user.username}
```

```bash
make seed
DEBUG=true make dev-back        # num terminal
curl localhost:8000/usuarios/eu-temporario -H "X-User-Id: 1"
# → {"id":1,"username":"ada"}
curl localhost:8000/usuarios/eu-temporario
# → {"detail":"não autenticado"}
```

Com isso, quem pegou posts, feed ou curtidas já pode proteger rotas com
`Depends(get_current_user)` e trabalhar em paralelo.

---

## Parte 1: backend

### Passo 1: registro (`test_auth_registro`)

**1.1** Removam o `@pytest.mark.skip` de `test_auth_registro` e vejam o teste falhar:

```bash
cd backend && uv run pytest -q -k auth_registro
# → FAILED ... assert 404 == 201        (a rota não existe ainda; criá-la é a tarefa)
```

**1.2** Adicionem a coluna do hash em `app/models/user.py`:

```python
password_hash: Mapped[str] = mapped_column(String(100), default="")
```

Deem uma senha aos usuários do seed, senão ninguém consegue logar como eles.
Em `scripts/seed.py`:

```python
import bcrypt

SENHA_SEED = "senha-forte-123"  # a mesma para todo usuário do seed; anotem no README
HASH_SEED = bcrypt.hashpw(SENHA_SEED.encode(), bcrypt.gensalt()).decode()

USUARIOS = [
    User(username="ada", name="Ada Lovelace", bio="...", password_hash=HASH_SEED),
    # ... o mesmo para os outros
]
```

O SQLite não altera a tabela sozinho. Apaguem o `app.db` e rodem `make seed`
de novo. Se aparecer "no such column", faltou isso (ver guia 04).

**1.3** Criem `app/schemas/auth.py`:

```python
from pydantic import BaseModel, Field


class RegistroIn(BaseModel):
    username: str = Field(min_length=3, max_length=30, pattern=r"^[a-z0-9_]+$")
    name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=8)


class LoginIn(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    token: str
```

**1.4** Criem `app/routers/auth.py` com o `POST /auth/registro`. O hash:

```python
import bcrypt

hash_ = bcrypt.hashpw(dados.password.encode(), bcrypt.gensalt()).decode()
```

O `gensalt()` embute um salt aleatório no próprio hash, então dois usuários
com a mesma senha têm hashes diferentes. A resposta é o `UserOut` de sempre, e
o teste confere que nenhum campo de senha vaza. Username duplicado devolve 409,
como no slice de exemplo. Registrem o router em `main.py` (1 linha).

**1.5** Verificação:

```bash
uv run pytest -q -k auth_registro
# → 1 passed
```

### Passo 2: login (`test_auth_login`)

**2.1** Removam o skip e vejam falhar (`assert 404 == 200`).

**2.2** Criem `app/models/session.py` e importem em `app/models/__init__.py`:

```python
from datetime import datetime, timezone

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Session(Base):
    __tablename__ = "sessions"

    token: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )
```

**2.3** `POST /auth/login`: busquem o user pelo username, confiram a senha com
`bcrypt.checkpw(dados.password.encode(), user.password_hash.encode())`, criem a
sessão com `secrets.token_urlsafe(32)` e devolvam `{"token": ...}`.

Senha errada e username inexistente devolvem o mesmo 401 genérico. Responder
"usuário não existe" revela quais usuários existem para quem está chutando.

Usuário sem senha também é 401. Quem foi criado pelo `POST /usuarios` do slice
de exemplo, ou por um seed sem `password_hash`, tem o hash vazio, e
`bcrypt.checkpw` com hash vazio não devolve `False`: ele explode com
`ValueError: Invalid salt` e o login vira `500`. Confiram o hash antes:

```python
if not user or not user.password_hash or not bcrypt.checkpw(
    dados.password.encode(), user.password_hash.encode()
):
    raise HTTPException(status_code=401, detail="usuário ou senha inválidos")
```

**2.4** Verificação:

```bash
uv run pytest -q -k auth_login
# → 1 passed
curl -s -X POST localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"ada","password":"errada"}'
# → {"detail":"..."} com status 401  (se vier 500, faltou checar o hash vazio)
```

### Passo 3: o `get_current_user` real (`test_auth_eu`)

**3.1** Removam o skip e vejam falhar.

**3.2** Troquem o corpo do `get_current_user` do Passo 0: leiam o header
`Authorization`, aceitem só o formato `Bearer <token>`, busquem a sessão e
devolvam o dono. O bypass de DEBUG continua no topo e não atrapalha, porque em
produção não existe DEBUG.

```python
import os

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session as DbSession

from app.db import get_db
from app.models.session import Session
from app.models.user import User


def get_current_user(
    authorization: str | None = Header(default=None),
    x_user_id: int | None = Header(default=None),
    db: DbSession = Depends(get_db),
) -> User:
    if os.environ.get("DEBUG") == "true" and x_user_id is not None:
        user = db.get(User, x_user_id)
        if user:
            return user

    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ")
        sessao = db.get(Session, token)
        if sessao:
            return db.get(User, sessao.user_id)

    raise HTTPException(status_code=401, detail="não autenticado")
```

**3.3** `GET /auth/eu` em `routers/auth.py`:

```python
@router.get("/eu", response_model=UserOut)
def eu(user: User = Depends(get_current_user)):
    return user
```

Apaguem a `/eu-temporario` do Passo 0.

**3.4** Verificação:

```bash
uv run pytest -q -k auth
# → 3 passed
curl -s -X POST localhost:8000/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"ada","password":"senha-forte-123"}'
# copie o token e:
curl -s localhost:8000/auth/eu -H "Authorization: Bearer <token>"
# → seu usuário
```

A partir daqui a fixture `logar`/`auth_client` dos testes funciona, e o resto
do time pode tirar o skip dos testes de posts, feed e curtidas.

---

## Parte 2: frontend

O token fica no `localStorage`. O `localStorage` é vulnerável a XSS (um script
injetado lê o token). O cookie `httpOnly` é vulnerável a CSRF e exige configurar
CORS com credenciais. Aqui o `localStorage` ganha por ser mais simples de
entender e depurar. Em produção, vocês avaliariam as duas opções. JWT está no
guia 05.

### Passo 4: o helper de fetch manda o token

No helper de fetch do front (bloco 3 do guia 10), usem uma função `headers()`
assim:

```ts
function headers(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}
```

### Passo 5: páginas `/registro` e `/login`

Criem formulários controlados com `use client` e `apiPost`. O que muda no submit do login:

```ts
const { token } = await apiPost<{ token: string }>("/auth/login", { username, password });
localStorage.setItem("token", token);
router.push("/");   // useRouter() de "next/navigation"
```

O registro chama `/auth/registro` e depois segue o mesmo fluxo do login, ou
manda para `/login`. O logout é `localStorage.removeItem("token")` num botão da navbar.

### Passo 6: guarda de rota

Criem `lib/useExigeLogin.ts` e chamem o hook no topo de toda página privada:

```ts
"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useExigeLogin() {
  const router = useRouter();
  useEffect(() => {
    if (!localStorage.getItem("token")) router.push("/login");
  }, [router]);
}
```

O hook só confere se existe um token, não se ele ainda vale. Token que deixou
de valer (banco apagado, servidor do deploy reiniciado) é tratado no
helper de fetch: qualquer `401` com token salvo apaga o token e manda para
`/login`. Não removam essa parte.

### Verificação ponta a ponta

1. `make dev-back` (sem DEBUG) e `make dev-front`.
2. Na UI, registrem, loguem e abram o DevTools (F12), aba Network. Toda
   request tem `Authorization: Bearer ...`.
3. `localStorage.getItem("token")` no console devolve o token.
4. Apaguem o token no console e recarreguem: a página privada manda para `/login`.

Os 4 erros comuns desta parte estão no guia 04: 401 sem header (faltou o
Passo 4), token some no refresh (salvo em variável em vez de `localStorage`),
`use client` faltando (useState em server component) e CORS (backend fora do
ar ou porta errada).
