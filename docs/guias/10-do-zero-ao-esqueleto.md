# Guia 10: do zero ao esqueleto em ~30 minutos

No hackathon não vai ter template: a primeira hora começa da página em branco.
Este guia recria do zero um esqueleto equivalente ao deste repo, com backend
FastAPI + SQLite e front Next conversando. Treinem antes para fazer no dia sem
precisar pensar.

## Os 10 comandos

```bash
# backend
mkdir meu-projeto && cd meu-projeto            # 1
uv init backend && cd backend                  # 2
uv add fastapi "uvicorn[standard]" sqlalchemy  # 3
# crie app.py com os blocos 1 e 2 abaixo       # 4
uv run uvicorn app:app --reload                # 5
curl localhost:8000/ping                       # 6  → {"pong":true}

# frontend (em outro terminal, na raiz do projeto)
npx create-next-app@latest frontend --ts --tailwind --app --no-src-dir --yes  # 7
cd frontend                                    # 8
# crie lib/api.ts com o bloco 3 abaixo         # 9
npm run dev                                    # 10 → localhost:3000
```

## Os 3 blocos para copiar

Não precisam memorizar o conteúdo. No hackathon, copiem daqui.

Bloco 1: FastAPI + CORS. Sem o CORS, o front dá erro na primeira chamada.

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
def ping():
    return {"pong": True}
```

Bloco 2: SQLite + sessão, o `db.py` de qualquer projeto.

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

engine = create_engine("sqlite:///./app.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Para os models, criem classes herdando de `Base` e chamem
`Base.metadata.create_all(engine)` no startup, como no `main.py` deste repo.

Bloco 3: fetch tipado no front (`lib/api.ts`).

```ts
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}
```

## Teste final

Criem uma página `"use client"` que chama `apiGet("/ping")` e mostra o
resultado. Se `pong` aparecer na tela, o esqueleto funciona. O caminho model →
rota → fetch → tela é o caminho de toda feature.

Façam isso uma vez na semana antes do hackathon, cronometrando. A meta é 30
minutos consultando só esta página.
