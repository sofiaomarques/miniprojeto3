# Contrato da API (Go)

Erros: `{"error":"mensagem"}`. Autenticação: `Authorization: Bearer <jwt Supabase>`;
com `DEV_AUTH=true` vale `X-Dev-User: <uuid>`.

## Pessoa 2 — descoberta e avaliações

| Método | Rota | Descrição |
|---|---|---|
| GET | `/providers?category=&city=&sort=rating` | Busca de prestadoras com filtros |
| GET | `/providers/{id}` | Perfil + galeria + média + avaliações |
| POST | `/reviews` | Só cliente; 1 por par; nota 1–5 |
| GET | `/reviews?mine=1` | Avaliações feitas pela cliente logada |

## Pessoa 1 — perfis (preencher)

## Pessoa 3 — chat (preencher)
