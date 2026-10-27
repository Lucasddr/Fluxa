# Análise Completa do Projeto Fluxa

> Documento gerado a partir da análise do código-fonte, documentação e histórico do Git.
> Última análise: 15/10/2026.

> ### 🕓 Documento HISTÓRICO (retrato de 15/10/2026)
>
> Esta análise foi feita **antes** de vários itens serem implementados. Vários problemas que ela
> lista como pendentes **já estão resolvidos** no código atual:
> - editar/excluir/detalhes de transação no frontend → **feito**;
> - interceptor de 401 + refresh de sessão (`services/api.ts`) → **feito**;
> - URL de exclusão de categoria (`DELETE /categories/{id}`) → **corrigida**;
> - WIP do Radix `MenuListmodal` (prop `trigger`) → **consistente** (chamadores atualizados);
> - paginação de transações no backend + `LEFT JOIN FETCH` → **feito**.
>
> Para o **estado atual verificado** e as pendências reais, use:
> **`docs/ROADMAP-FECHAMENTO-PENDENCIAS.md`** (e o banner de correções em `docs/DIAGNOSTICO-MVP.md`).
>
> Observação de nomenclatura: o produto no código/UI é **Fluxa**; os docs de sprint usam **Opsire**.
> Decisão de branding ainda em aberto (ver roadmap).

---

## 1. O que é o projeto (a ideia)

**Fluxa** é uma plataforma pessoal de gestão financeira cujo diferencial é mostrar ao usuário o **Saldo Disponível real**, e não um saldo bruso enganoso.

A lógica central, definida em `docs/fluxa-requisitos.md`:

```
Saldo Disponível = Saldo Real − Saldo Comprometido
```

| Conceito | Significado |
|---|---|
| **Saldo Real** | Receitas menos despesas já registradas. |
| **Saldo Comprometido** | Obrigações futuras já assumidas (principalmente parcelas de compras no crédito). |
| **Saldo Disponível** | O que o usuário *realmente* pode gastar. |

### Escopo do MVP
- Cadastro e login de usuários
- Registro de receitas e despesas
- Registro de compras no crédito parceladas (parcelas = compromissos futuros)
- Visualização do Saldo Disponível
- Visualização do histórico de transações

### Roadmap futuro (definido nos docs)
- Login com Google
- Simulação financeira
- Exportação de dados (CSV/planilhas)
- Metas, notificações e investimentos (checkboxes do `README.md`)
- Evolução para SaaS — no `docs/MDs sprints/` o produto aparece também como **"Opsire"**, um SaaS B2C/B2B com plano free + pago, landing page e onboarding.

> **Nota de identidade:** o produto no código/UI é **Fluxa** (nomes de pacotes, DB, app), enquanto os documentos de sprint/backlog usam **Opsire** como nome do produto. São o mesmo projeto com dois rótulos — vale alinhar isso.

---

## 2. Arquitetura geral

```
Fluxa/
├── backend/     → API Spring Boot (Java 17 + PostgreSQL)
├── frontend/    → Aplicação Next.js (App Router, React 19)
├── docs/        → Requisitos, modelagem e documentos de sprint
└── README.md    → Visão geral e checklist de features
```

| Camada | Stack |
|---|---|
| Backend | Spring Boot 4.0.3, Java 17, Maven, JPA/Hibernate, PostgreSQL 17, Flyway, Spring Security, JWT (jjwt 0.13), Argon2, Bucket4j, Lombok |
| Frontend | Next.js 16 (App Router), React 19.2, TypeScript 5, Tailwind CSS 4, Chart.js/Recharts, Lucide icons, Radix UI (parcial) |
| Infra | Docker (backend + Postgres), docker-compose, GitHub Actions (planejado) |

---

## 3. O que JÁ FOI FEITO (backend)

### 3.1 Autenticação e segurança — ✅ concluído
- Registro de usuário (`POST /auth/register`) que cria também **conta padrão** e **categorias padrão** (Salário, Mercado, Educação).
- Login (`POST /auth/login`) retornando par de tokens: JWT de acesso + refresh token.
- **Refresh token rotativo** armazenado com hash SHA-256, com validação de expiração/revogação (`RefreshTokenService`).
- Logout com revogação (`POST /auth/logout`), `GET /auth/me`.
- Cookies **HttpOnly/SameSite** configuráveis por env (`CookieService`).
- Filtro JWT (`JwtFilter`) que lê o cookie `access_token` e seta o contexto de autenticação.
- **Rate limiting** com Bucket4j nos endpoints de login (5/min) e registro (3/min), retornando 429 + `Retry-After`.
- Encoder de senha **Argon2**, estado sem sessão (stateless), CORS configurado por propriedade.
- `SecurityConfig` com regras por role (ADMIN para `/admin/**` e `/auth/registerAdmin`).

**Arquivos-chave:**
`backend/src/main/java/com/fluxa/backend/security/{SecurityConfig,JwtFilter,RateLimitFilter,JwtService}.java`,
`backend/src/main/java/com/fluxa/backend/service/{AuthService,RefreshTokenService,CookieService,RateLimitService}.java`

### 3.2 Banco de dados — ✅ concluído
Migrations Flyway:

| Migration | O que faz |
|---|---|
| `V1__initial_schema.sql` | Schema completo: `users`, `accounts`, `categories`, `credit_purchases`, `installments`, `transactions`, `refresh_tokens`, view de saldo, índices. |
| `V2__refactor_auth_and_categories.sql` | Corrige `role` (keyword reservada), restringe `kind` a INCOME/EXPENSE, adiciona FK e constraints. |
| `V3__remove_account_balance_columns.sql` | **Remove o saldo materializado** (`accounts.current_balance`, `start_balance`) e a view — o `transactions` vira fonte de verdade. |

- `ddl-auto: validate` (a migração é sempre explícita, nunca pelo Hibernate).
- Entidades: `User`, `Account`, `Category`, `Transaction`, `CreditPurchase`, `Installment`, `RefreshToken`.
- Enums: `CategoryKind` (INCOME/EXPENSE), `InstallmentStatus`, `PaymentMethods` (CREDIT, DEBIT, PIX, CASH, OTHER), `Role`.
- Todos os repositórios usam ownership por `userId` nas consultas de escrita/leitura.

### 3.3 Categorias — ✅ CRUD completo
- `POST /categories/create`, `GET /categories`, `GET /categories/select`, `PATCH /categories/{id}`, `DELETE /categories/{id}`
- Validações de duplicidade e ownership.
- ⚠️ **Porem:** `listCategories` ignora os parâmetros `page`/`size` (fixa `PageRequest.of(0,10)`).

### 3.4 Transações — ✅ CRUD completo no backend
- `POST /transactions/create`, `GET /transactions/list`, `PATCH /transactions/{id}`, `DELETE /transactions/{id}`
- Consultas agregadas para o dashboard: total receita/despesa no período, maior gasto, somatórios.
- Paginação com limite máximo de 100 por página (`PageableUtils`).
- ⚠️ `listTransactions` usa `JOIN FETCH` interno + `getCategory().getName()` sem null-check → transações com categoria nula são **silenciosamente descartadas** (audit 3.6 previa `LEFT JOIN FETCH`).

### 3.5 Dashboard — ✅ implementado
- `GET /dashboard/buildDashboard?start=&end=` → saldo, receita, despesa, contas a pagar (parcelas), saldo mensal.
- `GET /dashboard/recentTransactions` → últimas 10 transações.
- `GET /dashboard/insightCards` → cards de economia + maior gasto (`InsightAggregatorService`).

### 3.6 Tratamento de erros e observabilidade — ✅ concluído
- `GlobalExceptionHandler` mapeia: email duplicado → 409, credenciais inválidas → 401, validação → 400, erros não mapeados → **500** (antes retornava 400 enganoso), entidades não encontradas → 404.
- Remoção de debug do `Dockerfile` e padronização de mensagem de erro.

### 3.7 Histórico de commits recentes (o que já rodou)
```
19e7c67 2026-10-13 fix(backend): parse to DTO no categories service
f54fef4 2026-10-13 chore(backend): remove kind nos DTOs de transação
c6b1fe0 2026-10-13 refactor(backend): remove colunas de saldo + atualiza services
42a3266 2026-10-08 fix(backend): exception handling e confiabilidade
03265e4 2026-10-08 db: V2 schema refactor
c93da95 2026-10-07 feat: refresh token authentication
b569937 2026-10-06 fix(security): fecha falhas críticas de autorização
...  (mais ~30 commits anteriores)
```

---

## 4. O que JÁ FOI FEITO (frontend)

### 4.1 Estrutura e páginas
| Rota | Status |
|---|---|
| `/` (landing) | ✅ Pronta, links para login/register |
| `/login`, `/register` | ✅ Prontas, validação client-side |
| `/home` (layout) | ✅ Guard de autenticação via `/auth/me` |
| `/home/dashboard` | ✅ Funcional (período **hardcoded**) |
| `/home/transactions` | 🟡 Lista + criação OK; editar/detalhes/excluir **não** |
| `/home/categories` | 🟡 Lista + criação OK; editar/excluir **stub** |
| `/home/insights` | ❌ Fetch comentado, sempre "Nenhum insight encontrado" |
| `/home/insightsTest` | 🟡 Demo estática com dados falsos |
| `/home/configurations` | ❌ "Coming soon" |
| `/home/reports` | ❌ "Coming soon" |
| `/home/accounts` | ❌ Não existe |

### 4.2 Pontos fortes do frontend
- **Transactions**: busca/filtro/ordenação/paginação via `useMemo` (client-side), modal de criação com modais isolados e validações próprias.
- **Dashboard**: fetch paralelo dos 3 endpoints, `ValueCard`, `GraficoDonut`, `InsightCards`, transações recentes, menu de logout.
- **Auth guard**: layout `/home` verifica sessão e redireciona para `/login`.
- Serviço de API centralizado (`services/api.ts`) com `credentials: "include"`.

### 4.3 O que NÃO está feito / está quebrado
1. **Sem interceptor de 401 / refresh de sessão** — item obrigatório da Sprint 4.
2. **Edição/exclusão/detalhes de transações** não existe (botão `⋮` não faz nada).
3. **Categorias**: "Excluir" chama `DELETE /categories/delete` (URL erra; o correto é `DELETE /categories/{id}`) e o handler **nunca é conectado**; "Editar" e "Ver detalhes" só fazem `console.log`.
4. **Dashboard com período fixo**: `start = "2026-04-01"`, `end = "2026-12-30"`.
5. **Sem gerência de estado global** (sem TanStack Query/Redux/Zustand) — só `useState`/`useEffect`.
6. **Sem navegação mobile**: `BottomNav.tsx` está vazio (0 bytes).
7. **Sem página de contas**.
8. **Filtro de categorias hardcoded** na tela de transações.

### 4.4 Trabalho em progresso NÃO commitado (WIP)
```
Modificados (não commitados):
  backend/.../RateLimitFilter.java          (import removido)
  frontend/.../MenuListmodal.tsx            (migração p/ Radix DropdownMenu)
  frontend/.../categories/page.tsx          (offsets de menu)
  frontend/package.json + package-lock.json (+@radix-ui/react-dropdown-menu, Next ^16.4.1)

Não versionados:
  docs/MDs sprints/                          (TODO o docs de sprint/backlog)
```
> ⚠️ **Ponto de atenção:** `MenuListmodal` agora exige uma prop `trigger`, mas os chamadores (`dashboard/page.tsx`, `categories/page.tsx`) ainda passam apenas `actions`. Esse WIP está **inconsistente** e vai quebrar até os chamadores serem atualizados.

---

## 5. Documentação existente

| Documento | Conteúdo |
|---|---|
| `docs/fluxa-requisitos.md` | Requisitos, objetivos, conceitos de saldo, escopo do MVP, não-funcionais. |
| `docs/fluxa-banco-de-dados.md` | Modelagem v1: tabelas, relacionamentos, lógica de compromissos. |
| `docs/fluxa-banco-de-dados-v2-ledger-saldo.md` | Proposta v2: ledger + saldo materializado. **(divergente do código — o V3 removeu o saldo materializado)** |
| `docs/MDs sprints/Opsire_Auditoria_Tecnica_Final.md` | Auditoria técnica consolidada (3 rodadas) de backend: boot, segurança, dados, performance, morte de código. |
| `docs/MDs sprints/Opsire_Backlog_Integrado.md` | Backlog conjunto backend+frontend, Sprints 4-11, padrões de arquitetura, fluxos E2E, DoD e regras de execução. |
| `docs/MDs sprints/Opsire_Roadmap_Sprints_Estimativas.md` | Roadmap com estimativas (~145-233h). **Sprint 3 concluída** (exceto 3.15 — adiada); Sprints 4-13 pendentes. |
| `docs/MDs sprints/README-frontend-bibliotecas-Opsire.md` | Plano de modernização do frontend com Radix UI, TanStack Table/Query (todos os itens **desmarcados**). |
| `frontend/app/teste2/readmes/*.md` | Docs de design das telas de Categorias/Transações — **desatualizados**, ainda descrevem a versão com dados mock. |

> ⚠️ `docs/MDs sprints/` **não está commitado** no Git.

---

## 6. Status do backlog por Sprint

| Sprint | Escopo | Status |
|---|---|---|
| 1-3 | Boot, autenticação, segurança, CRUD base, dashboard, exception handling | ✅ **Concluída** (item 3.15 adiado) |
| **4** | Fluxo completo de transações no front (editar/excluir/detalhes), refresh de sessão, idempotência | 🟡 Backend OK / Front pendente |
| **5** | Seletor de período no dashboard, ícones reais, paginação server-side, filtros na lista de transações | ❌ Pendente |
| **6** | Navegação mobile (bottom nav), refatoração de código com auxílio de IA, sem duplicações | ❌ Pendente |
| **7** | Testes de autenticação, recuperação de senha, verificação de e-mail, log review | ❌ Pendente |
| **8** | Formalização de saldo, índices, auditoria de N+1, agregações | ❌ Pendente |
| **9** | UX: loading/skeletons/toasts/estados vazios, tradução de mensagens, identidade visual Opsire | ❌ Pendente |
| **10** | Segurança/produção: `X-Forwarded-For`, LGPD, CI/CD, checklist de autorização | ❌ Pendente |
| **11** | SaaS: plano free/pago, landing page, onboarding | ❌ Pendente |
| 12-13 | Testes end-to-end, auditoria final | ❌ Pendente |

---

## 7. Pendências e problemas identificados

### 🔴 Bloqueadores / bugs
1. ~~**WIP do Radix quebrado**: `MenuListmodal` exige `trigger`, chamadores não passam.~~ ✅ Resolvido (migração Radix concluída; chamadores passam `trigger`).
2. ~~**URL de exclusão de categoria errada** no frontend (`/categories/delete` vs `DELETE /categories/{id}`).~~ ✅ Resolvido (`services/categories.ts` usa `DELETE /categories/{id}`).
3. **Conta única por usuário (by design desde 2026-10-16)**: `AccountRepository.findByUserId` retorna um único `UUID`; página Contas gerencia só parcelados, sem CRUD de contas (decisão do usuário).
4. ~~**`InstallmentStatus.OVERDUE`** existe no enum Java mas o CHECK do banco aceita `CANCELED` — mismatch.~~ ✅ Resolvido pela `V8__installment_overdue_status.sql` (CHECK: `PENDING/PAID/OVERDUE/CANCELED`).
5. ~~**Transações sem categoria são invisíveis** (JOIN interno + NPE em `getCategory().getName()`).~~ ✅ Resolvido (BKL-001: backend bloqueia delete com 409 + mapping null-safe com fallback "Sem categoria").

### 🟡 Divergências código × documentação
6. ~~`docker-compose.yml` ainda tem senha hardcoded (`POSTGRES_PASSWORD: ld0423`)~~ — resolvido em 2026-10-27: compose usa `${POSTGRES_PASSWORD:-fluxa_local_dev}` e a credencial antiga foi rotacionada no volume local.
7. `docs/fluxa-banco-de-dados-v2-ledger-saldo.md` descreve saldo materializado, mas o código removeu essas colunas (V3).
8. `README.md` marca Dashboard e Insight Cards como `[x]`, mas insights não busca dados.
9. Docs de frontend (`teste2/readmes`) descrevem mocks que já não existem.

### 🟢 Código morto / limpeza
10. `AccountController` **vazio**; `AccountService.createCustomAccount` nunca é chamado (não há endpoint de conta).
11. `CategoriesService.findCategories` / `toDTO` sem uso.
12. Debug endpoints abertos: `GET /auth/test-500`, `GET /auth/test`, `POST /auth/registerAdmin`.
13. `CreateAccountDTO` sem uso.
14. Constraints duplicadas em `V1` (`installment_uniq` e `installments_uniq`).

### 🔒 Segurança
15. `RateLimitFilter` usa `request.getRemoteAddr()` (audit 3.15 **adiada**) — por trás de proxy/ingress é sempre o IP do proxy.
16. Rate limit cobre apenas login/register — não cobre criação de transação, reset de senha ou envio de e-mail.
17. `X-Forwarded-For` não processado.
18. Sem CI/CD pipeline, sem testes automatizados.

### 🧪 Testes
19. Apenas `BackendApplicationTests` (`contextLoads`). Nenhum teste de serviço, integração ou E2E.

---

## 8. Métricas rápidas do código

| Métrica | Valor |
|---|---|
| Commits | ~50+ (branch `main`, última em 13/10/2026) |
| Endpoints backend | ~20 (auth, user, transactions, categories, dashboard) |
| Entidades de domínio | 7 |
| Migrations Flyway | 3 |
| Páginas frontend | 11 rotas |
| Componentes | ~15 (modais, gráficos, navegação, itens) |
| Testes automatizados | 1 (`contextLoads`) |
| Estimativa total do roadmap | 145–233 horas |

---

## 9. Conclusão: onde o projeto está

**Estágio atual:** MVP com a **base backend sólida** (autenticação, CRUD de transações/categorias, dashboard, segurança, migrations) e **frontend parcialmente conectado à API**.

**Próximos passos prioritários (Sprint 4 + correções):**
1. Corrigir o WIP do `MenuListmodal`/Radix (ou reverter) antes de commitar.
2. Implementar editar/excluir/detalhes de transações no frontend.
3. Corrigir exclusão de categoria (URL) e conectar os handlers.
4. Implementar interceptor 401 + refresh de sessão em `services/api.ts`.
5. Commitar `docs/MDs sprints/`.
6. Resolver `LEFT JOIN FETCH` para transações sem categoria.

**Pontos fortes:** arquitetura limpa com separação backend/frontend bem definida, ownership por usuário em todas as consultas, migrations explícitas, refresh token com rotação e hash, e uma documentação de backlog/auditoria muito bem estruturada.

**Pontos fracos:** frontend sem gerenciamento de estado de servidor, quase nenhum teste, código morto acumulado, e divergências entre docs e código que podem confundir quem entrar no projeto.
