# backend-go

API em Go (`net/http` + `pgx`), servidor comum que lê `PORT`. Deploy no Render (`render.yaml` na raiz).

```bash
cp .env.example .env
go run ./cmd/server      # http://localhost:8080/health
```

Cada pessoa edita só os próprios pacotes em `internal/` (ver o `doc.go` de cada um).
Contrato dos endpoints: [`../API.md`](../API.md).
