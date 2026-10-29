# Deploy — Fluxa (Sprint 10)

> Ambientes atuais e planejados:
> - **Local/dev**: `docker-compose` (`postgres:17` na `5433`) + `next start` na `:3001` via nginx `:80`.
> - **Produção pública atual**: frontend **Vercel** (`www.opsire.com.br`) + backend **Render** (`api.opsire.com.br`).
> - **Migração futura**: backend **Railway** + frontend **Vercel** + banco **Supabase**.
> Deploy é automático por plataforma a cada push na `main`; o workflow
> `.github/workflows/ci.yml` só valida (gates) — não faz deploy.

## Arquitetura

| Peça | Local/dev | Produção atual | Migração futura |
|---|---|---|---|
| Backend | `docker compose` `:8080` | Render `api.opsire.com.br` | Railway, root `backend/`, Dockerfile |
| Frontend | `:3001` via nginx `:80` | Vercel (root `frontend/`) | Vercel (root `frontend/`) |
| Banco | `postgres:17` local | Banco atual do serviço Render | Supabase (Flyway `V1–V12` no boot) |
| `NEXT_PUBLIC_API_URL` | `http://26.220.230.81/api` | `https://api.opsire.com.br/api` | `https://<service>.up.railway.app/api` |

## Backend no Render (produção atual)

O Dockerfile do backend sobe Spring Boot e Nginx no mesmo serviço. O Nginx
mantém as rotas antigas (`/auth/...`) e também publica `/api/...`, removendo o
prefixo `/api` antes de encaminhar ao Spring. Para deixar o tráfego do navegador
same-site com o frontend, configure o domínio customizado `api.opsire.com.br`
no serviço Render e crie o CNAME indicado pelo painel do Render.

No serviço Render, configure `PORT=10000`, `COOKIE_SECURE=true`,
`COOKIE_SAME_SITE=Lax` e `CORS_ALLOWED_ORIGINS=https://opsire.com.br,https://www.opsire.com.br`.
Mantenha `COOKIE_REFRESH_PATH=/auth`: o Nginx muda o caminho do cookie para
`/api/auth` apenas nas respostas da rota com proxy. As rotas atuais sem `/api`
continuam recebendo `Path=/auth`.

Na Vercel, defina `NEXT_PUBLIC_API_URL=https://api.opsire.com.br/api` e faça um
novo deploy para embutir a URL no frontend.

## Backend na Railway (alternativa histórica, não é o alvo atual)

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
4. Primeiro boot: Flyway valida e aplica `V1–V12` (`ddl-auto=validate`, migrations nunca editadas).
5. Deploy automático: conectado ao GitHub, cada push na `main` redeploya após o CI verde.

## Frontend na Vercel

1. Project a partir do repo, **Root Directory = `frontend`**, framework Next.js.
2. Environment Variable: `NEXT_PUBLIC_API_URL` = URL do backend do ambiente
   (produção atual: `https://api.opsire.com.br/api`; migração futura: `https://<service>.up.railway.app/api`).
   Sem barra no final.
   - É **embutida no build** (`next build`) — trocar exige rebuild/redeploy.
3. Deploy automático a cada push na `main` (Preview a cada PR).

## Banco (Supabase)

- Criar projeto Postgres e copiar a connection string + senha.
- Nada a instalar: o schema é criado pelas migrations Flyway no boot do backend.
- Dev local continua no `docker-compose` (`DB_URL=jdbc:postgresql://postgres:5432/fluxa` dentro da rede do compose).
- Nunca apontar dev para o Supabase de prod (risco de sujar dados reais).

## Ordem de subida (Render + Vercel + Supabase, cenário atual)

1. Supabase → confirmar backup/restauração antes de qualquer migration nova.
2. Render (backend, root `backend/`) com as variáveis de produção → aguardar boot + Flyway (`Successfully validated 12 migrations`).
3. Vercel (frontend, root `frontend/`) com `NEXT_PUBLIC_API_URL=https://api.opsire.com.br/api`.
4. Smoke automatizado: `node scripts/smoke-prod.mjs` (frontend, headers de segurança, CORS permitido/negado, rota protegida, login inválido, JSON malformado e `refresh` sem cookie; falha em qualquer 5xx). Para o fluxo autenticado, rodar com `SMOKE_EMAIL`/`SMOKE_PASSWORD` — o script não imprime token nem cookie.
5. Smoke manual complementar: login → dashboard → CRUD transação → importação de extrato → logout.

## Rollback

- Railway e Vercel guardam deploys anteriores: rollback é um clique (Redeploy) em cada plataforma.
- Banco: migrations são incrementais e imutáveis — rollback de código nunca apaga coluna/tabela sozinho.
