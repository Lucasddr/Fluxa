# Variáveis de ambiente — Fluxa

> Checklist de `.env` para dev e produção. Veja `backend/.env.example` e
> `frontend/.env.example` para os templates. Deploy: `docs/DEPLOY.md`.
>
> Dev = `docker-compose` local (postgres `5433`). Prod = Supabase (banco) +
> Railway (backend) + Vercel (frontend). Nunca apontar dev para o Supabase
> de prod.

## Backend (`backend/.env` ou `backend/.env.docker`)

| Variável | Obrigatória | Exemplo | Notas |
|---|---|---|---|
| `DB_URL` | sim | dev: `jdbc:postgresql://postgres:5432/fluxa` (rede do compose) · prod: `jdbc:postgresql://db.<ref>.supabase.co:5432/postgres` | URL JDBC do Postgres 17 |
| `DB_USERNAME` | sim | `postgres` | |
| `DB_PASSWORD` | sim | (segredo) | Nunca commitar valor real |
| `JWT_SECRET` | sim | (segredo, min 32 chars) | Assinatura HMAC dos access tokens |
| `JWT_EXPIRATION` | não | `900000` | ms de vida do access token (padrão 15min) |
| `REFRESH_TOKEN_EXPIRATION` | não | `604800000` | ms de vida do refresh token (padrão 7 dias) |
| `COOKIE_SECURE` | sim | `false` em dev, `true` em prod | Exige HTTPS quando `true` |
| `COOKIE_SAME_SITE` | sim | `Lax` | `Strict` quebra fluxos cross-site |
| `COOKIE_ACCESS_PATH` | não | `/` | Escopo do cookie de acesso |
| `COOKIE_REFRESH_PATH` | não | `/api/auth` | Escopo do cookie de refresh |
| `CORS_ALLOWED_ORIGINS` | sim | `http://localhost,http://26.220.230.81` | Lista separada por vírgula, SEM porta = só porta 80; nunca `*` com credentials |

Notas de produção (Railway + Supabase + Vercel):
- `COOKIE_SECURE=true` + HTTPS obrigatório.
- `JWT_SECRET` com no mínimo 32 caracteres aleatórios (gerar um novo só para prod).
- Revisar `CORS_ALLOWED_ORIGINS` para o domínio real da Vercel (sem `localhost`).
- `NEXT_PUBLIC_API_URL` da Vercel = `https://<service>.up.railway.app/api`.
- `DB_URL` de prod = JDBC do Supabase; primeiro boot aplica Flyway `V1–V8` sozinho.

## Frontend (`frontend/.env.local`)

| Variável | Obrigatória | Notas |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | sim | URL absoluta da API **na mesma origem** do navegador (ex.: `http://26.220.230.81/api`). Sem barra no final. É embutida no build (`next build`) — rebuildar ao trocar. |

## Banco (docker-compose)

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` no `backend/docker-compose.yml`
  (**hoje com senha hardcoded `ld0423` — mover para env antes de qualquer deploy compartilhado**).
- Migrations Flyway `V1`–`V8` aplicadas automaticamente no boot; nunca editar migration já aplicada.
