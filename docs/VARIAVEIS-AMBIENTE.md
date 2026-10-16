# Variáveis de ambiente — Fluxa

> Checklist de `.env` para produção. Veja `backend/.env.example` e
> `frontend/.env.example` para os templates.

## Backend (`backend/.env` ou `backend/.env.docker`)

| Variável | Obrigatória | Exemplo | Notas |
|---|---|---|---|
| `DB_URL` | sim | `jdbc:postgresql://postgres:5432/fluxa` | URL JDBC do Postgres 17 |
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

Notas de produção:
- `COOKIE_SECURE=true` + HTTPS obrigatório.
- `JWT_SECRET` com no mínimo 32 caracteres aleatórios.
- Revisar `CORS_ALLOWED_ORIGINS` para os domínios reais (sem `localhost`).

## Frontend (`frontend/.env.local`)

| Variável | Obrigatória | Notas |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | sim | URL absoluta da API **na mesma origem** do navegador (ex.: `http://26.220.230.81/api`). Sem barra no final. É embutida no build (`next build`) — rebuildar ao trocar. |

## Banco (docker-compose)

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` no `backend/docker-compose.yml`
  (hoje com senha hardcoded — mover para env antes de qualquer deploy compartilhado).
- Migrations Flyway `V1`–`V6` aplicadas automaticamente no boot; nunca editar migration já aplicada.
