# Fluxa

A modern financial management platform focused on your real available balance.

O diferencial: mostrar o **Saldo Disponível** real, não o saldo bruto enganoso.

```
Saldo Disponível = Saldo Real − Saldo Comprometido
```

| Conceito | Significado |
|---|---|
| **Saldo Real** | Receitas menos despesas já registradas. |
| **Saldo Comprometido** | Obrigações futuras já assumidas (parcelas de compras no crédito). |
| **Saldo Disponível** | O que o usuário realmente pode gastar. |

## Stack

### Frontend
- Next.js 16 (App Router), React 19, TypeScript, TailwindCSS 4
- Radix UI (Dialog/DropdownMenu), Recharts, lucide

### Backend
- Spring Boot 4, Java 17, Spring Security, Spring Data JPA
- PostgreSQL 17, Flyway, JWT (access) + refresh token opaco, Argon2

### Infra
- Backend na Railway, frontend na Vercel, banco no Supabase (prod)
- Docker Compose para o ambiente local

## Status

> **Estado real e pendências:** `docs/ROADMAP-FECHAMENTO-PENDENCIAS.md`

Resumo da `main` em 2026-10-16 + progresso das branches locais em 2026-10-19:

| Área | Status |
|---|---|
| Autenticação (JWT + refresh + cookies + Argon2 + rate limit) | ✅ |
| Recuperação de senha e verificação de e-mail | ✅ |
| Transações: criar / listar / detalhar / editar / excluir (idempotência) | ✅ |
| Categorias: CRUD + ativar/desativar + bloqueio em uso | ✅ |
| Dashboard com seletor de período + insights (economia, maior despesa) | ✅ |
| Sessão: interceptor 401 + refresh único + auto-logout | ✅ |
| **Compras no crédito parceladas (installments) — diferencial do produto** | 🟡 backend em andamento (service/repo/DTOs/V8); falta controller + UI |
| **Módulo de Contas (multi-conta)** | ✅ implementado na branch local `feat/account-management`: CRUD, padrão e seleção nos lançamentos/parcelas |
| **Saldo conferido + projeções 7/30/90 dias** | ✅ implementado na branch local `feat/balance-reconciliation`; importação ainda em andamento |
| **Navegação mobile** | ❌ pendente |
| Insights/Reports/Configurações | 🟡 parcial/stub |

O checklist detalhado, priorizado e estimado está no roadmap acima.

## Running locally

Requisitos: Java 17, Node 22, Docker.

```bash
# backend + Postgres
cd backend
docker compose up -d          # Postgres 17 em localhost:5433
./mvnw spring-boot:run

# frontend
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

Configuração: veja `docs/VARIAVEIS-AMBIENTE.md` e os `.env.example`.

## Deploy

Backend (Railway) + frontend (Vercel) + banco (Supabase): `docs/DEPLOY.md`.

## Documentação

| Documento | Conteúdo |
|---|---|
| `docs/ROADMAP-FECHAMENTO-PENDENCIAS.md` | **Roadmap atual e pendências verificadas** |
| `docs/DIAGNOSTICO-MVP.md` | Diagnóstico do MVP vs. visão do produto |
| `docs/fluxa-requisitos.md` | Requisitos e conceitos de saldo |
| `docs/ARCHITECTURE-DECISIONS.md` | ADRs (ex.: fonte oficial do saldo) |
| `docs/DEPLOY.md` / `docs/VARIAVEIS-AMBIENTE.md` | Deploy e configuração |
| `docs/MDs sprints/` | Backlog, auditoria técnica e estimativas (histórico) |
