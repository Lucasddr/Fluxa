# Fluxa — Frontend

Aplicação Next.js 16 (App Router) + React 19 + TypeScript + TailwindCSS 4.

## Rodando

```bash
npm install
npm run dev        # http://localhost:3000
```

Configure `frontend/.env.local` (veja `frontend/.env.example` e `docs/VARIAVEIS-AMBIENTE.md`):

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

> `NEXT_PUBLIC_API_URL` é **embutida no build** (`next build`) — trocar exige rebuild.

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Sobe o build |
| `npm run lint` | ESLint (há dívida técnica pré-existente) |

## Estrutura

```
app/
  components/     # UI, modais, navegação, gráficos
  home/           # área autenticada: dashboard, transactions, categories, ...
  login, register, forgot-password, reset-password, verify-email, privacy, terms
  utils/          # formatters, http helpers
services/         # API layer centralizada (api.ts, auth, transactions, categories, dashboard)
```

- **Autenticação:** cookies HttpOnly gerenciados pelo backend; `services/api.ts` faz o
  interceptor de 401 (refresh único + retry + auto-logout).
- **Estado de servidor:** hoje via `useState`/`useEffect` + `services/*` (sem TanStack Query).
- Regra de negócio fica no **backend**; o front apenas coleta/apresenta dados.

## Documentação do projeto

- `../docs/ROADMAP-FECHAMENTO-PENDENCIAS.md` — pendências e roadmap atual
- `../docs/ARCHITECTURE-DECISIONS.md` — ADRs
- `../docs/VARIAVEIS-AMBIENTE.md` — variáveis de ambiente
- `../docs/DEPLOY.md` — deploy (Vercel)

## Teste / visual

- As rotas `/home/insights`, `/home/insightsTest` e `/home/reports` foram removidas
  no refactor Quiet Ledger (insights vivem no dashboard, em "Leituras").
  `app/teste2/` contém docs de design **desatualizados** — pendente de remoção.
