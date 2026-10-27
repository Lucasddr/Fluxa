# Roadmap de Fechamento das Pendências — Fluxa/Opsire

> Gerado a partir da leitura do código real (backend + frontend), das migrations, dos
> testes, do CI e de toda a documentação em `docs/`.
> Data da análise: 2026-10-16.
>
> **Objetivo:** fechar o que já existe antes de aumentar o produto. Cada item abaixo foi
> verificado no código — não é cópia do backlog aspiracional de `docs/MDs sprints/`.

---

## 0. Como ler este documento

- **Verificado** = confirmado diretamente no código nesta análise.
- Esforço em horas = faixa realista para 1 dev solo part-time (mesma base do roadmap antigo).
- Prioridade: **P0** fecha o produto que existe · **P1** consistência/UX · **P2** produção · **P3** limpeza/docs · **P4** comercial.

---

## 1. Estado real verificado (o que JÁ está pronto)

### Backend (sólido)
- Auth completo: JWT + **refresh token opaco rotativo** (hash SHA‑256) + cookies HttpOnly/SameSite + Argon2.
- Recuperação de senha e verificação de e‑mail (services, tokens, V4/V5, testes).
- Rate limiting com Bucket4j **em 7 endpoints** (login, register, transações/create, forgot/reset-password, send-verification, verify-email) — `RateLimitFilter`.
- Categorias: CRUD, ativar/desativar, bloqueio de exclusão em uso (409), list/select.
- Transações: CRUD, ownership, validação conta/categoria/kind, **idempotência** (janela 10s + `Idempotency-Key`).
- Dashboard com **seletor de período** (`start`/`end`), validação de intervalo (start≤end, ≤366d).
- Insights: economia + maior despesa (`InsightsService`/`InsightAggregatorService`).
- `LEFT JOIN FETCH` nas listagens de transação (N+1 resolvido).
- Migrations Flyway **V1→V8**; `ddl-auto: validate`.
- Testes H2: `AuthServiceTest` (10), `PasswordResetServiceTest` (6), `EmailVerificationServiceTest` (6).
- `ErrorResponseDTO` padronizado + `GlobalExceptionHandler`.
- CI GitHub Actions com gates: testes backend + `tsc --noEmit` + build frontend.
- Docs: ADRs, deploy, env vars, LGPD (minuta), backlog e diagnóstico.

### Frontend (parcialmente completo)
- Fluxos de auth: login, registro, **forgot/reset password**, verify-email.
- **API layer centralizada** (`services/*`) + **interceptor 401** com lock único de refresh, retry único e auto‑logout (`services/api.ts`).
- Dashboard: seletor de período (7d/15d/30d/3m/6m), skeletons, empty/error + retry.
- Transações: ciclo completo **criar → detalhar → editar → excluir** com toasts, confirmações e idempotency key.
- Categorias: CRUD completo, ativar/desativar, exclusão com tratamento 409.
- Radix UI (Dialog + DropdownMenu), mobile responsivo em tabelas (grid desktop + cards mobile).
- Páginas `privacy` e `terms` publicadas.

> **Conclusão da leitura:** os docs `ANALISE-DO-PROJETO.md` (15/10) estão **desatualizados** —
> muito do que ele marca como pendente já está feito. O `DIAGNOSTICO-MVP.md` (16/10) é o
> retrato mais fiel, e mesmo ele superestima alguns "✅".

---

## 2. Pendências reais (verificadas no código)

> **Nota (2026-10-16):** durante a higienização surgiu no working tree (não commitado) um início do
> **módulo de Crédito/Parcelas** — `CreditPurchaseRepository`, `CreditPurchaseService`, DTOs,
> exceptions, handlers e a migration **V8**. O P0‑1 e o P0‑4 abaixo já refletem esse avanço.
> O estado das migrations no repo agora é **V1–V8**.

### P0 — Fecham o produto que já existe

| # | Pendência | Evidência no código | Impacto |
|---|---|---|---|
| **P0‑1** | **Módulo de Compras no Crédito + Parcelas (installments)** — o diferencial "saldo comprometido" | ✅ **Entregue 2026-10-16 (main `f9db346`):** backend (`767e85b`: `CreditPurchaseService`, `InstallmentService`, controllers, DTOs, rate limit; `8a6b67f`: pay/list/update; `361cf0e`: 13 testes H2) + frontend (`f9db346`: página `/home/accounts`, modal iguais/manual, pagar, editar ONE/FOLLOWING, delete tudo-junto). Prova ao vivo no Postgres. | Núcleo usável ponta a ponta. |
| **P0‑2** | **Módulo de Contas (Account)** sem CRUD e sem multi‑conta | `AccountController` está **vazio**; `AccountService.createCustomAccount` nunca é chamado; `CreateAccountDTO` sem uso; `AccountRepository.findByUserId`/`findAccountNameByUserId` retornam **um único** valor (`UUID`/`String`) → assume 1 conta/usuário. | Não há como o usuário criar/gerenciar contas; a Sprint 3.10 marcou "concluído" mas o código ainda trava em conta única. |
| **P0‑3** | **Navegação mobile inexistente** | `app/components/navigation/BottomNav.tsx` tem **0 bytes** e não é importado em lugar nenhum; `SideNav` só aparece em `lg:` (`hidden lg:flex`). Em `<lg` o usuário **não tem menu algum**. | Em mobile (público‑alvo 320px+) não dá pra navegar entre telas. |
| **P0‑4** | ~~Mismatch do status de parcela~~ | ✅ **Resolvido e commitado (`767e85b`, main):** `V8__installment_overdue_status.sql` (CHECK aceita `PENDING/PAID/OVERDUE/CANCELED`, alinhado ao enum; aplicado ao vivo no Postgres via Flyway). | — |

### P1 — Consistência e UX

| # | Pendência | Evidência no código | Impacto |
|---|---|---|---|
| **P1‑1** | Paginação de categorias quebrada | `CategoryController.getCategories()` chama `listCategories()` sem params; `CategoriesService.listCategories()` faz `PageRequest.of(0, 10)` **hardcoded**. O front envia `?page=&size=` (5/10/20) que são ignorados. | A tela de categorias sempre mostra 10 itens, página 0. Botões de paginação não funcionam. |
| **P1‑2** | Transações: filtros e paginação **client‑side** | `services/transactions.ts` `listTransactions()` não envia paginação/ordenação; a página carrega `data.content` e filtra/ordena/pagina via `useMemo` sobre **só a página retornada**. Backend já suporta `Pageable`. | Busca por texto, filtros e ordenação só enxergam um subconjunto; o contador "X transações encontradas" engana. |
| **P1‑3** | Filtro de categorias hardcoded | `app/home/transactions/page.tsx` tem array `Categories` fixo ("Mercado", "Entradas"...) em vez de consumir `GET /categories/select`. | Filtro não reflete as categorias reais do usuário. |
| **P1‑4** | Página de Insights não funcional | `app/home/insights/page.tsx`: o `fetch` está **comentado**; espera `InsightPageDTO` (financialScore, categoryRanking...) que **o backend não retorna**. | Tela sempre "Nenhum insight encontrado"; contrato inexistente. |
| **P1‑5** | Card `installments_amount` só no front | `dashboard/page.tsx` define `InstallmentsAmountDTO` como parte de `InsightCardDTO`; `InsightAggregatorService` só retorna `economy` + `most_expense_category`. | Tipagem mentirosa / expectativa de feature inexistente. Decidir: implementar (depende de P0‑1) ou remover. |
| **P1‑6** | Reports e Configurations são stubs | `app/home/reports/page.tsx` e `configurations/page.tsx` = "Coming soon". | Rotas de navegação levam a páginas vazias. |
| **P1‑7** | Rotas/artefatos de teste expostos | `app/home/insightsTest/` (demo estática) e `app/teste2/readmes/*` (docs de mocks antigos, desatualizados). | Ruído, risco de confusão. |

### P2 — Produção e segurança

| # | Pendência | Evidência no código | Impacto |
|---|---|---|---|
| **P2‑1** | `X-Forwarded-For` no rate limit | Resolvido em 2026-10-27: `server.forward-headers-strategy=native` + testes de bucket por IP encaminhado. | Atrás de proxy o IP do cliente é usado; XFF de origem não confiável não é aceito. |
| **P2‑2** | Senha do Postgres hardcoded no compose | Resolvido em 2026-10-27: `${POSTGRES_PASSWORD:-fluxa_local_dev}` nos composes; credencial antiga rotacionada no volume local. | Nenhum segredo real no arquivo rastreado. |
| **P2‑3** | Endpoints de debug/privilegiados | Resolvido: `/auth/test-500` removido em 2026-10-27; `/auth/registerAdmin` exige `ROLE_ADMIN`. | Superfície reduzida. |
| **P2‑4** | Sem suíte E2E automatizada | Resolvido em 2026-10-27: 14 testes Playwright + 39 Vitest + 147 backend. | Fluxos críticos com regressão automatizada. |
| **P2‑5** | Lint não bloqueante com dívida aberta | CI: `npm run lint` em `continue-on-error`, com 4 erros + 9 warnings (`react-hooks/set-state-in-effect`, unused vars). | Dívida escondida no verde do CI. |

### P3 — Limpeza, dívida técnica e documentação

| # | Pendência | Evidência |
|---|---|---|
| **P3‑1** | Código morto | `AccountController` vazio; `AccountService.createCustomAccount` e `CategoriesService.findCategories`/`toDTO` (parcial) sem uso; `CreateAccountDTO` sem uso. |
| **P3‑2** | Doc de banco divergente | `docs/fluxa-banco-de-dados-v2-ledger-saldo.md` descreve saldo materializado, mas a `V3` removeu essas colunas (decisão = queries ao vivo, ADR‑001). |
| **P3‑3** | README desatualizado | Marca Dashboard e Insight Cards como `[x]`, mas a tela de Insights não busca dados; roadmap do README não reflete o backlog real. |
| **P3‑4** | Docs de frontend obsoletos | `app/teste2/readmes/*` descrevem versões com mocks. |
| **P3‑5** | Branding divergente | **Decidido (2026-10-16): migrar para Opsire.** Renomeação completa (UI, docs, pacotes `com.fluxa`) fica para depois; a decisão está registrada no vault. Enquanto isso, código/DB/UI seguem como `fluxa`. |
| **P3‑6** | Documentos não versionados | `docs/MDs sprints/`, `docs/ANALISE-DO-PROJETO.md`, `docs/DIAGNOSTICO-MVP.md`, `frontend/AGENTS.md` estão **untracked**. |
| **P3‑7** | Script SQL morto | `postgres_data` volume + constraints duplicadas em `V1` (`uk_installments_purchase_number` e `uq_installments_cp_number` são idênticas). |

### P4 — Comercial (pós‑MVP, conforme documento central)
- Free tier / plano pago (limites), landing page, onboarding (cadastro → conta → categorias → 1ª transação → dashboard).

---

## 3. Roadmap por ondas

Sequenciamento pensado para **fechar fluxos ponta a ponta** e never construir em cima de terreno instável.

### Onda 0 — Higiene e alinhamento (quick wins) · ~4–6h
> Pré‑requisito de tudo. Barato e destrava clareza.
> **Docs:** ✅ concluído em 2026-10-16 (README, DIAGNOSTICO, ANALISE, banco v1/v2, sprints, audit,
> frontend README, requisitos). Pendente apenas **commitar** e **decidir branding Fluxa×Opsire**.

**Docs — feito:**
1. ✅ README reescrito (status real + link para este roadmap).
2. ✅ `DIAGNOSTICO-MVP.md` e `ANALISE-DO-PROJETO.md` anotados/corrigidos (o segundo marcado como histórico).
3. ✅ `fluxa-banco-de-dados.md` / `-v2-ledger-saldo.md` alinhados ao ADR-001/V3.
4. ✅ Docs de sprint (roadmap, backlog, auditoria, bibliotecas) com banners de status real.
5. ✅ `VARIAVEIS-AMBIENTE.md` (V1–V8), `frontend/README.md`, `fluxa-requisitos.md`, readmes `teste2`.

**Código — pendente:**
6. ✅ Commitar a documentação nova/alterada. *(P3‑6)*
7. ✅ Decidir branding Fluxa × Opsire → **migrar para Opsire** (renomeação posterior). *(P3‑5)*
8. ⏳ Corrigir paginação de categorias: `Controller` recebe `Pageable`, `Service` usa `PageableUtils`. *(P1‑1)*
9. ⏳ Senha do compose por env var. *(P2‑2)*
10. ⏳ Remover/limitar endpoints `test-500` e `registerAdmin` em prod. *(P2‑3)*
11. ⏳ Remover código morto e artefatos de teste (`insightsTest`, `teste2`). *(P3‑1, P1‑7)*

**Saída:** repositório limpo, docs alinhados, tela de categorias paginando de verdade.

### Onda 1 — Diferencial do produto: Crédito & Parcelas (P0) · ~24–36h
> O item que realmente fecha o MVP do "Saldo Disponível".
> **Em andamento (WIP não commitado em 2026-10-16):** itens 1, 2 (parcial) e 3 (parcial) já têm código.
1. ✅ **Migration V8**: alinhar status de parcela (enum ↔ CHECK). *(P0‑4 — feito, não commitado)*
2. ✅ **Backend**: `CreditPurchaseRepository`, `CreditPurchaseService`, `InstallmentService`,
   `CreditPurchaseController` e `InstallmentController` · DTOs · geração de parcelas (iguais/manuais)
   · pagamento de parcela (`/installments/{id}/pay`) · ownership/validação de categoria ·
   rate limit dos novos endpoints · `CreditPurchaseServiceTest`. *(tudo no WIP não commitado)*
3. 🟡 **Backend**: `getTotalPayableAccounts` agora soma `PENDING`+`OVERDUE` (ligado ao ADR‑001);
   revisar se o saldo do dashboard usa a mesma janela.
4. ❌ **Frontend**: tela de compras parceladas (criar/listar/detalhar/cancelar), parcelas no período, dashboard.
5. ❌ **Frontend**: card `installments_amount` (implementar ou remover). *(P1‑5)*
6. 🟡 Teste de service criado (`CreditPurchaseServiceTest`); falta validar/expandir e rodar no CI.

**Saída:** usuário registra compra no crédito → parcelas viram compromissos → Saldo Disponível e "Contas a Pagar" refletem a realidade.

### Onda 2 — Contas + navegação mobile (P0) · ~16–24h
1. **Backend**: resolver multi‑conta — `AccountRepository.findByUserId` → lista; `AccountService` CRUD; `AccountController` com endpoints; seleção de conta default; validações.
2. **Frontend**: página de Contas (CRUD), seletor de conta onde aplicável.
3. **Frontend**: implementar `BottomNav` (mobile) e montá‑lo no `home/layout`; revisar contraste de navegação para `<lg`.

**Saída:** produto utilizável no celular e com gestão de contas.

### Onda 3 — Frontend "inbox de dados" real (P1) · ~16–24h
1. **Transações server‑side**: enviar paginação/ordenação para `/transactions/list`; mover filtros para o backend; consumir `GET /categories/select` no filtro de categoria. *(P1‑2, P1‑3)*
2. **Insights**: definir contrato real com o backend e ligar o fetch (ou transformar a página em composição dos dados que já existem: economia + maior despesa + compromissos). *(P1‑4)*
3. **Reports**: entregar a primeira versão útil ou remover a rota da navegação. *(P1‑6)*
4. **Configurations**: idem (mínimo: dados do usuário + logout + LGPD). *(P1‑6)*

**Saída:** telas que hoje enganam passam a funcionar ou deixam de existir.

### Onda 4 — Produção e confiabilidade (P2) · ~14–20h
1. `server.forward-headers-strategy` + `X-Forwarded-For` no `RateLimitFilter`. *(P2‑1)*
2. Suíte E2E automatizada dos 6 fluxos críticos (Playwright): cadastro→login→dashboard; CRUD transação; sessão expirada→refresh→retry; refresh inválido→logout; concorrência/double‑submit; ownership A×B. *(P2‑4)*
3. Zerar dívida de lint e tornar o gate bloqueante. *(P2‑5)*
4. Observabilidade/logs (revisão final) + finalizar LGPD (política/termos/consentimento e banner só se necessário).
5. Checklist final de autorização por endpoint.

**Saída:** base pronta para usuários reais, com regressão coberta por CI.

### Onda 5 — Comercial / SaaS (P4) · ~15–30h
Free tier, escopo do plano pago, landing page, onboarding. Só depois das ondas 1–4.

---

## 4. Resumo de esforço

| Onda | Escopo | Horas |
|---|---|---|
| 0 | Higiene, docs, fix rápido de paginação categorias | 4–6h |
| 1 | **Crédito & Parcelas (P0, núcleo do produto)** | 24–36h |
| 2 | Contas + navegação mobile (P0) | 16–24h |
| 3 | Frontend com dados reais (server‑side, insights, reports) | 16–24h |
| 4 | Produção, E2E, lint gate, LGPD | 14–20h |
| 5 | Comercial/SaaS | 15–30h |
| **Total** | | **≈ 89–140h** |

> O roadmap antigo estimava 145–233h. A diferença existe porque boa parte das Sprints 3–9
> **já foi executada** e confirmada neste código. O que sobra são as ondas acima.

---

## 5. Correções de rota na documentação (fazer junto da Onda 0)

- `ANALISE-DO-PROJETO.md`: marcar como **histórico** (retrato de 15/10). Vários "pendentes" (edit/delete transação, refresh interceptor, URL de delete de categoria) **já estão feitos**.
- `DIAGNOSTICO-MVP.md`: ajustar "Contas sem saldo armazenado ✅" → na verdade o **CRUD de contas** e **multi‑conta** continuam abertos (P0‑2).
- `fluxa-banco-de-dados-v2-ledger-saldo.md`: apontar para ADR‑001 (saldo por query ao vivo, V3 removeu colunas).
- `README.md`: substituir o roadmap de checkboxes por um link para este documento.
- `Opsire_*` (docs de sprint): marcar Sprints 4–9 conforme o estado real verificado.

---

## 6. Definition of Done (mantida)

Backend implementado · Frontend integrado · DTO/API alinhados · autorização revisada ·
loading + erro + empty state quando aplicável · mobile considerado · teste criado/atualizado ·
sem regressão · build verde · commitado.

## 7. Regras a preservar

Não reescrever arquitetura sem necessidade. Não confirmar `userId` do frontend. Nunca editar
migration já aplicada (criar `V8`+). Backend é a autoridade de negócio. Fechar fluxos
existentes antes de criar novos.
