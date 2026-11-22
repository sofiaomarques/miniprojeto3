# backend-go

API em Go (`net/http` + `pgx`), servidor comum que lê `PORT`. Deploy no Render (`render.yaml` na raiz).

```bash
go run ./cmd/server      # http://localhost:8080/health
```

Variáveis esperadas (crie um `.env` local, que não é commitado): `PORT`, `DATABASE_URL`,
`SUPABASE_JWT_SECRET`, `ALLOWED_ORIGINS`, `DEV_AUTH`.

Cada pessoa edita só os próprios pacotes em `internal/` (ver o `doc.go` de cada um).
Contrato dos endpoints: [`../API.md`](../API.md).
