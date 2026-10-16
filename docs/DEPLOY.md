# Deploy — Fluxa (Sprint 10)

> Três ambientes (decisão do usuário em 2026-10-16):
> - **Local/dev**: `docker-compose` (`postgres:17` na `5433`) + `next start` na `:3001` via nginx `:80`.
> - **Staging (prod de testes, gratuita)**: frontend na **Vercel** + backend no **Render**
>   (`https://fluxa-su89.onrender.com`, API na raiz, sem `/api`).
> - **Prod pública (futura, paga)**: backend na **Railway** (mais rápida) + frontend na
>   **Vercel** + banco no **Supabase**. Só na hora do lançamento.
> Deploy é automático por plataforma a cada push na `main`; o workflow
> `.github/workflows/ci.yml` só valida (gates) — não faz deploy.

## Arquitetura

| Peça | Local/dev | Staging (testes) | Prod pública (futura) |
|---|---|---|---|
| Backend | `docker compose` `:8080` | Render `https://fluxa-su89.onrender.com` | Railway, root `backend/`, Dockerfile |
| Frontend | `:3001` via nginx `:80` | Vercel (root `frontend/`) | Vercel (root `frontend/`) |
| Banco | `postgres:17` local | (o do Render; ver painel) | Supabase (Flyway `V1–V8` no boot) |
| `NEXT_PUBLIC_API_URL` | `http://26.220.230.81/api` | `https://fluxa-su89.onrender.com` (sem `/api`) | `https://<service>.up.railway.app/api` |

## Backend na Railway (prod futura)

1. Novo service a partir do repo, **Root Directory = `backend`**, builder Dockerfile.
2. Variáveis (Service → Variables) — mesmos nomes de `backend/.env.example`:
   - `DB_URL` = `jdbc:postgresql://db.<ref>.supabase.co:5432/postgres` (JDBC do Supabase, pooler `:6543` se preferir)
   - `DB_USERNAME` / `DB_PASSWORD` = credenciais do Supabase (nunca commitar)
   - `JWT_SECRET` = segredo HMAC com 32+ chars aleatórios (gerar novo para prod)
   - `COOKIE_SECURE` = `true` (HTTPS obrigatório)
   - `COOKIE_SAME_SITE` = `Lax`
   - `CORS_ALLOWED_ORIGINS` = URL pública da Vercel (ex.: `https://fluxa.vercel.app`), sem `localhost`, nunca `*` com credentials
   - `JWT_EXPIRATION` / `REFRESH_TOKEN_EXPIRATION` / `COOKIE_*_PATH` = padrões (ver `docs/VARIAVEIS-AMBIENTE.md`)
3. Networking → gerar domínio público; a API passa a responder em `https://<service>.up.railway.app`.
4. Primeiro boot: Flyway valida e aplica `V1–V8` (`ddl-auto=validate`, migrations nunca editadas).
5. Deploy automático: conectado ao GitHub, cada push na `main` redeploya após o CI verde.

## Frontend na Vercel

> ⚠️ Status 2026-10-16: todos os deploys falham em 1-2s (build 0ms — falha no setup).
> Causa provável: **Root Directory** na raiz do repo (sem `package.json`) em vez de
> `frontend/`, + **zero env vars** configuradas. Corrigir no dashboard
> (Settings → General → Root Directory = `frontend`; Settings → Environment
> Variables → `NEXT_PUBLIC_API_URL` conforme a tabela acima); o próximo push na
> `main` redeploya sozinho.

1. Project a partir do repo, **Root Directory = `frontend`**, framework Next.js.
2. Environment Variable: `NEXT_PUBLIC_API_URL` = URL do backend do ambiente
   (staging: `https://fluxa-su89.onrender.com`; prod futura: `https://<service>.up.railway.app/api`).
   Sem barra no final.
   - É **embutida no build** (`next build`) — trocar exige rebuild/redeploy.
3. Deploy automático a cada push na `main` (Preview a cada PR).

## Banco (Supabase)

- Criar projeto Postgres e copiar a connection string + senha.
- Nada a instalar: o schema é criado pelas migrations Flyway no boot do backend.
- Dev local continua no `docker-compose` (`DB_URL=jdbc:postgresql://postgres:5432/fluxa` dentro da rede do compose).
- Nunca apontar dev para o Supabase de prod (risco de sujar dados reais).

## Ordem de subida (primeiro deploy)

1. Supabase → anotar URL/usuário/senha.
2. Railway (backend) com as variáveis → aguardar boot + Flyway OK nos logs.
3. Vercel (frontend) com `NEXT_PUBLIC_API_URL` apontando para a Railway.
4. Smoke test: cadastro → login → dashboard → CRUD transação → logout.

## Rollback

- Railway e Vercel guardam deploys anteriores: rollback é um clique (Redeploy) em cada plataforma.
- Banco: migrations são incrementais e imutáveis — rollback de código nunca apaga coluna/tabela sozinho.
