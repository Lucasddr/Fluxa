# Diagnóstico do MVP — Opsire (Fluxa)

**Data:** 2026-10-15  
**Baseado em:** Documento Central de Visão do Opsire + Estado real do repositório (git, código, testes) + Obsidian vault

> ### ⚠️ Correções após revisão de código (2026-10-16)
>
> Este diagnóstico foi revisado contra o código e **superestima o estado de alguns itens**.
> Pendências verificadas e roadmap atual: **`docs/ROADMAP-FECHAMENTO-PENDENCIAS.md`**.
>
> Correções:
> - **"Contas sem saldo armazenado ✅"** é parcialmente enganoso: as colunas de saldo saíram (V3),
>   mas o **CRUD de Contas e o multi-conta continuam abertos** — `AccountController` está vazio e
>   `AccountRepository.findByUserId` retorna **uma única** conta (P0).
> - **"Mobile 390px/320px ✅"** cobre o layout das telas, mas **não existe navegação mobile**:
>   `BottomNav.tsx` está vazio (0 bytes) e o `SideNav` é `hidden lg:flex`. Em `<lg` não há menu (P0).
> - **`Installments/Credit Purchases CRUD`** está **em andamento (WIP não commitado)**: já existem
>   `CreditPurchaseRepository`, `CreditPurchaseService`, DTOs, exceptions e a migration **V8**;
>   **faltam** o `CreditPurchaseController` e todo o frontend (P0).
> - **Paginação de categorias está quebrada**: `CategoriesService.listCategories()` faz
>   `PageRequest.of(0, 10)` fixo e ignora `page`/`size` (P1).
> - **Página de Insights** tem o `fetch` comentado e espera um contrato que o backend não retorna (P1).
> - ~~**`X-Forwarded-For`** segue não tratado no `RateLimitFilter` (P2).~~ Resolvido em 2026-10-27 com `server.forward-headers-strategy=native` e teste de IP encaminhado.
> - ~~**`docker-compose.yml`** ainda tem senha hardcoded (`POSTGRES_PASSWORD: ld0423`) (P2).~~ Resolvido em 2026-10-27: senha via env e credencial antiga rotacionada.
> - **Endpoints de debug** `/auth/test-500` removido em 2026-10-27; `/auth/registerAdmin` exige `ROLE_ADMIN` no `SecurityConfig` (verificado no código atual).

---

## Resumo Executivo

O projeto **já possui um núcleo operacional funcional em produção** (backend Railway + frontend Vercel + Supabase PostgreSQL). As Sprints 1-6 + BKL-001/002 estão **implementadas e validadas**. O MVP está **~70% completo** considerando a visão do documento central.

**Principais conquistas:**
- Autenticação completa (JWT + Refresh token opaco + HttpOnly cookies + 401 interceptor com lock único + auto-logout)
- CRUD completo de Transações e Categorias com validação de ownership
- Dashboard com seletor de período (7d/15d/30d/3m/6m) e validação backend
- Insight cards (economia + maior despesa) + transações recentes
- Proteção anti-duplicação (frontend + backend idempotência 10s)
- Mobile-first (320px+), Radix UI (Dialog + DropdownMenu), API layer centralizada
- Testes H2: AuthService (10) + PasswordResetService (6) — todos verdes
- Migrations versionadas (V1-V8) com Flyway

---

## Classificação por Item da Visão

### ✅ Implementado e Validado

| Item | Evidência | Status |
|------|-----------|--------|
| **Autenticação JWT + Refresh Token opaco** | `AuthService`, `RefreshTokenService`, `JwtService`, `CookieService`, `SecurityConfig` | ✅ |
| **401 Interceptor com lock único + retry único + auto-logout** | `frontend/services/api.ts` (linhas 18-94) | ✅ |
| **Registro/Login/Admin + Argon2** | `AuthController`, `AuthService`, `SecurityConfig` | ✅ |
| **Forgot/Reset Password (Backend)** | `PasswordResetService`, `DevNotificationService`, `V4__password_reset_tokens.sql`, 6 testes | ✅ |
| **Categories CRUD + Ownership** | `CategoriesService`, `CategoryController`, `CategoryRepository` | ✅ |
| **BKL-001: Bloquear exclusão categoria com transações** | `CategoriesService.deleteCategory()` + `CategoryInUseException` (409) | ✅ |
| **BKL-002: Ativar/Desativar categoria** | `CategoriesService.updateCategory()` + `status` field + `listSelectCategories()` filtra ativas | ✅ |
| **Transações CRUD + Ownership** | `TransactionService`, `TransactionController` | ✅ |
| **Validação account/category/kind consistency** | `TransactionService.createTransaction()` + `updateTransaction()` | ✅ |
| **Idempotência criação transação (10s)** | `TransactionService.createTransaction()` + `existsByUserIdAndAmount...` | ✅ |
| **Anti-double-submit frontend** | `TransactionModal.saving` state | ✅ |
| **Dashboard período (7d/15d/30d/3m/6m)** | `DashboardController` + `DashboardPage` PERIODS | ✅ |
| **Validação intervalo backend (start≤end, max 366d)** | `DashboardController.validateRange()` | ✅ |
| **Dashboard cards: entradas, saídas, contas a pagar, saldo mensal** | `DashboardService.buildDashboardDTO()` + `BuildDashboardResponseDTO` | ✅ |
| **Insight cards: economia + maior despesa** | `InsightAggregatorService` + `InsightsService` | ✅ |
| **Transações recentes com período** | `TransactionService.listRecentTransactions()` | ✅ |
| **Installments + CreditPurchases domain** | Entities `Installment`, `CreditPurchase` + repositories | ✅ |
| **Contas sem saldo armazenado** | `Account` entity sem `start_balance`/`current_balance` (V3 removeu) | ✅ |
| **Category kind apenas INCOME/EXPENSE** | V2 migration removeu `BOTH` | ✅ |
| **Radix UI: Dialog + DropdownMenu** | `AppDialog`, `CategoryModal` (DropdownMenu), `TransactionModal` | ✅ |
| **Mobile 390px + 320px** | Commits `9e28176`, `d54d643` + re-auditoria zero overflow | ✅ |
| **API layer centralizada** | `services/api.ts` + `services/{auth,transactions,categories,dashboard}.ts` | ✅ |
| **Componentização** | `DetailRow`, `FormAlert`, `TxMenu`, `CatMenu` | ✅ |
| **Testes H2 (AuthService 10 + PasswordReset 6 + EmailVerification 6)** | `AuthServiceTest`, `PasswordResetServiceTest`, `EmailVerificationServiceTest` — todos verdes | ✅ |
| **Migrations Flyway V1-V8** | `V1__initial_schema` → `V8__installment_overdue_status` | ✅ |
| **Email Verification** | `EmailVerificationService`, V5, `/auth/send-verification`, `/auth/verify-email` | ✅ |
| **Toasts + Skeletons + Friendly errors** | `Toaster.tsx`, `Skeleton.tsx`, `HttpError` + `friendlyHttpError` | ✅ |
| **Idempotency-Key** | Header por abertura de modal + unique parcial + janela 10s fallback | ✅ |
| **Session auto-refresh** | Interceptor 401 + lock + retry + auto-logout | ✅ |
| **CORS por ambiente + credentials** | `SecurityConfig.corsConfigurationSource()` | ✅ |
| **Rate limiting (login/register)** | `RateLimitFilter` + `SecurityConfig` | ✅ |
| **ErrorResponseDTO padronizado** | `GlobalExceptionHandler` + `ErrorResponseDTO` | ✅ |

---

### ⚠️ Parcialmente Implementado (revisado em 2026-10-16)

| Item | O que falta | Prioridade |
|------|-------------|------------|
| **Installments/Credit Purchases CRUD** | Entities + repos existem, mas **sem endpoints, services, controllers, frontend** | Alta (core do diferencial "compromissos futuros") |
| **Reports/Insights pages** | `reports/page.tsx` e `insights/page.tsx` existem mas parecem incompletos/testes | Baixa |
| **Installments Amount Insight Card** | Frontend define `InstallmentsAmountDTO` mas backend **não retorna** (só economy + biggest expense) | Média |

Itens movidos para Implementado em 2026-10-16: Password Reset Frontend (7.4), Email Verification back+front (7.5/7.6), Logs review (7.7), Índices V6, N+1 (nenhum), Dashboard measurement, Fonte oficial do saldo (8.1 + ADR-001), Loading/skeletons/toasts/empty/confirmações/mensagens (Sprint 5 + 9.x), CORS/cookies/rate-limit/authorization/validation hardening (10.1-10.4), env docs + migrations + typing (Sprint 12), E2E validado via scripts.

---

### ❌ Pendente (do Documento Central)

| Item | Referência | Prioridade |
|------|------------|------------|
| **Logs review (INFO/DEBUG/WARN/ERROR)** | Seção 9, 10.5 | Média |
| **Índices PostgreSQL review** | Seção 8.2 | Média |
| **N+1 investigation (categoria nas listagens)** | Seção 8.3 | Média |
| **Dashboard measurement antes de otimizar** | Seção 8.4 | Média |
| **Fonte oficial do saldo (query vs agregação)** | Seção 8.1 | Alta |
| **Loading states, skeletons, toasts** | Seção 9.1 | Alta |
| **Empty states consistentes** | Seção 9.1 | Alta |
| **Confirmações destrutivas** | Seção 9.1 | Alta |
| **Mensagens de erro amigáveis** | Seção 9.2 | Alta |
| **Identidade visual escura (cinza/preto)** | Seção 9.3 | Alta |
| **Design system padronizado** | Seção 9.4 | Alta |
| **CORS produção review** | Seção 10.1 | Média |
| **Cookies produção validação** | Seção 10.2 | Média |
| **Rate limiting expansão** | Seção 10.3 | Baixa |
| **Authorization checklist** | Seção 10.4 | Média |
| **Validation hardening** | Seção 10.5 | Baixa |
| **LGPD: Política privacidade, Termos, Consentimento** | Seção 10.7 | Alta (pré-lançamento) |
| **CI/CD pipeline** | Seção 10.8 | Média |
| **Free tier definition** | Seção 11.1 | Baixa |
| **Paid plan scope** | Seção 11.2 | Baixa |
| **Landing page** | Seção 11.3 | Baixa |
| **Onboarding flow** | Seção 11.4 | Baixa |
| **Env docs, migration review, response typing** | Seção 12 | Baixa |
| **E2E tests (6 fluxos prioritários)** | Seção 13 | Alta |

---

### 🔮 Ideia Futura / Decisão em Aberto

| Item | Status |
|------|--------|
| **Tabelas agregadas / serviço sincronização** | Seção 4.4 — "ainda precisa ser tratada conforme arquitetura evoluir" |
| **Regras completas de projeção financeira** | Seção 13 — "não tratar como decisão final" |
| **Open Finance integration** | Seção 11.2, 13 — futuro |
| **Preços/limites planos** | Seção 13 — decisão comercial pendente |
| **Renomeação pacote `com.fluxa.backend` → `com.opsire`** | Seção 8.1 — "não realizar apenas porque marca mudou" |

---

## Contradições Identificadas

| Documento Central | Realidade do Código | Ação |
|-------------------|---------------------|------|
| "BKL-001 — Status: Pendente" | **Implementado e commitado** (`69faa11`) | ✅ Atualizado em 2026-10-16 |
| "BKL-002 — Status: Pendente" | **Implementado e commitado** (`1cd34cc`) | ✅ Atualizado em 2026-10-16 |
| "RateLimitFilter usa getRemoteAddr errado atrás de proxies" | Precisa verificação no código | Investigar |
| "Insight cards: installments amount" no frontend | Backend **não retorna** esse card | Alinhar (implementar ou remover do frontend) |
| "Sprint 7 — Status: EM ANDAMENTO" | 7.1-7.7 ✅ todos feitos e commitados | ✅ Atualizado em 2026-10-16 |
| "Refresh tokens opacos com rotação" | **Corretamente implementado** | Confirmar no documento |

---

## Lacunas Priorizadas do MVP (sem duplicar backlog)

### P0 — Crítico para MVP "confiável" (revisado em 2026-10-16)
1. **Password Reset Frontend** — ✅ feito (7.4)
2. **Fonte oficial do saldo** — ✅ formalizado (8.1 + ADR-001)
3. **Installments/Credit Purchases CRUD** — ❌ ABERTO (único P0 restante; sem sprint)
4. **Loading/Empty/Error states consistentes** — ✅ feito (Sprint 5 + 9.2)
5. **Mensagens de erro amigáveis** — ✅ feito (9.3 `HttpError` + `friendlyHttpError`)

### P1 — Qualidade de produto (revisado em 2026-10-16)
6. **Toasts (sucesso/erro)** — ✅ feito (9.1)
7. **Identidade visual escura + Design System** — ❌ adiado para a reforma (sem escopo)
8. **Confirmações destrutivas** — ✅ padronizado (Radix em todos os deletes)
9. **Logs review** — ✅ feito (7.7)
10. **E2E tests (6 fluxos)** — ✅ validados via scripts (sem suíte no repo)

### P2 — Produção/Segurança
11. **CI/CD pipeline** — Build + test + quality gates
12. **LGPD docs** — Política privacidade, Termos, Cookie handling
13. **CORS/Cookies/Rate limit/Validation production review**

### P3 — Comercial (pós-MVP)
14. **Free tier / Paid plan / Landing / Onboarding**

---

## Próximos Passos Recomendados

### Imediato (revisado em 2026-10-16)
1. **Password Reset Frontend** — ✅ feito (7.4)
2. **Alinhar Insight Card "installments amount"** — ❌ ABERTO (backend não retorna; decidir implementar ou remover do frontend)
3. **Atualizar Documento Central** — ✅ feito (BKLs + Sprint 7 + este diagnóstico)

### Curto prazo
4. **Installments CRUD** — ❌ ABERTO (backend endpoints + frontend)
5. **Loading/Empty/Error states** — ✅ feito
6. **Toasts + Design System tokens** — ✅ toasts feitos; tokens vão para a reforma

### Médio prazo
7. **Fonte oficial do saldo** — ✅ decidido (ADR-001, queries ao vivo)
8. **Logs** ✅ feito; **CI/CD + LGPD** ❌ ABERTOS (falta alvo de deploy + texto jurídico)
9. **E2E tests** — ✅ validados via scripts; suíte automatizada ❌ aberta

---

## Decisões Arquiteturais a Preservar

- ✅ Backend = autoridade de negócio (ownership validation obrigatória)
- ✅ Frontend não duplica regra de negócio
- ✅ UUIDs como PK simples
- ✅ Migrations imutáveis (V1-V8)
- ✅ Refresh token opaco + HttpOnly cookies
- ✅ API layer centralizada no frontend
- ✅ Radix UI para componentes complexos
- ✅ Mobile-first 320px+
- ✅ Conventional Commits + DoD rigoroso

---

## Riscos Conhecidos

1. **`RateLimitFilter.getRemoteAddr()`** — Pode não funcionar atrás de proxy (nginx/Railway). Verificar `X-Forwarded-For`. (Ainda aberto — item 3.15 adiado.)
2. **N+1 em listagens** — ✅ Resolvido: `LEFT JOIN FETCH` em tudo + contagens planas (Sprint 8.3).
3. **Dashboard queries** — ✅ Medido em 2026-10-16: 17-113ms, 1-4 queries por endpoint, sem fan-out (Sprint 8.4).
4. **Installments sem CRUD** — Domain existe mas não é exposto; pode gerar expectativa errada no usuário.
5. **Package name legacy** — `com.fluxa.backend` vs marca Opsire. Documentado como "não renomear por enquanto".

---

## Arquivos-Chave para Referência Rápida

| Domínio | Arquivos Principais |
|---------|---------------------|
| Auth | `AuthController`, `AuthService`, `SecurityConfig`, `api.ts` (interceptor) |
| Transações | `TransactionController`, `TransactionService`, `TransactionRepository`, `TransactionModal` |
| Categorias | `CategoryController`, `CategoriesService`, `CategoryRepository`, `CategoryModal` |
| Dashboard | `DashboardController`, `DashboardService`, `DashboardPage` |
| Insights | `InsightAggregatorService`, `InsightsService`, `InsightCards` |
| Installments | `CreditPurchaseService`, `InstallmentService`, controllers, DTOs, página `/home/accounts` (P0 entregue 2026-10-16) |
| Auth Tests | `AuthServiceTest` (10), `PasswordResetServiceTest` (6), `EmailVerificationServiceTest` (6) |
| Credit Tests | `CreditPurchaseServiceTest` (13) |
| Migrations | `V1__initial_schema` → `V8__installment_overdue_status` |