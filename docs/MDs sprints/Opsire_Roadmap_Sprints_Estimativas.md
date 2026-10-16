# Opsire — Roadmap Integrado (Backend + Frontend)

> Une o backlog de produto (`Opsire_Backlog_Integrado.md`, conversas de 27–28/09/2026) com os
> achados técnicos das 3 auditorias de backend. Numeração de sprint continua a partir de onde o
> backlog de produto parou (Sprints 1–2 de backend já concluídas).
>
> Estimativas em horas são **faixas realistas para 1 dev solo**, não horas "ideais" — já contam
> contexto, testes manuais e imprevistos de projeto pessoal/freelance.
>
> Ver `Opsire_Auditoria_Tecnica_Final.md` para o detalhamento técnico de cada bug citado aqui.

---

> ### ✅ Status real (revisão de código em 2026-10-16)
>
> Este roadmap foi escrito como **plano**; boa parte já foi executada. Estado verificado:
>
> | Sprint | Planejado | Status real |
> |---|---|---|
> | 3 — Débito técnico backend | 8–11h | ✅ **Concluída** (só 3.15 X-Forwarded-For segue aberto) |
> | 4 — Transações + sessão | 17–24h | ✅ **Concluída** (CRUD completo + idempotência + interceptor 401) |
> | 5 — Dashboard funcional | 10–17h | ✅ **Concluída** (seletor de período + validação de intervalo) |
> | 6 — Mobile + refatoração | 17–30h | 🟡 **Parcial**: layout mobile ✅, mas **navegação mobile ausente** (`BottomNav` vazio) |
> | 7 — Auth + testes | 19–30h | ✅ **Concluída** (forgot/reset, verify-email, testes de service, logs) |
> | 8 — Banco/domínio/performance | 10–18h | ✅ **Concluída** (ADR-001, V6 índice, LEFT JOIN FETCH, medição) |
> | 9 — UX + identidade | 16–27h | 🟡 **Parcial**: toasts/skeletons/empty/erros ✅; **design system/identidade visual adiado** |
> | 10 — Segurança + produção | 15–27h | 🟡 **Parcial**: rate limit expandido, CORS/cookies, CI ✅; **LGPD minuta**, senha do compose e debug abertos |
> | 11 — SaaS | 17–33h | ❌ Pendente |
> | 12 — Transversal | 3,5–6,5h | 🟡 Parcial |
> | 13 — E2E | 6–10h | ❌ Pendente (validado manualmente, sem suíte) |
>
> **Não coberto por este roadmap** (descoberto depois): **Compras no crédito + Parcelas** (núcleo do
> diferencial), **Módulo de Contas/multi-conta**, paginação de categorias, página de Insights.
> Roteiro atualizado: **`docs/ROADMAP-FECHAMENTO-PENDENCIAS.md`**.

---

## Visão geral e ordem de execução

```text
Sprint 3  → Débito técnico de backend (bloqueia deploy/confiabilidade)
Sprint 4  → Fechamento do fluxo de transações + sessão
Sprint 5  → Dashboard funcional
Sprint 6  → Mobile + refatoração do frontend
Sprint 7  → Autenticação completa + testes
Sprint 8  → Banco, domínio e performance
Sprint 9  → UX + identidade visual
Sprint 10 → Segurança + produção
Sprint 11 → SaaS / produto comercial
Sprint 12 → Backlog técnico transversal (contínuo, não sequencial)
Sprint 13 → Testes ponta a ponta prioritários
```

**Regra geral (herdada do backlog de produto):** não tratar backend e frontend como filas
separadas — fechar um fluxo (ex: editar transação) ponta a ponta antes de começar o próximo.
Não antecipar Redis, agregações ou otimizações complexas antes de medir comportamento real.
Nunca editar uma migration Flyway já aplicada em produção — sempre criar uma nova (`V2`, `V3`...).

**Estimativa total do roadmap:** aproximadamente **145–230 horas**. Isso é várias semanas de
trabalho part-time — não é pra fazer tudo de uma vez. A prioridade real, na ordem: fechar o que
já existe (3–5) → sustentar o código (6–8) → parecer produto (9) → aguentar usuário real (10) →
crescer (11).

---

## Sprint 3 — Débito técnico de backend (bloqueante)

**Por que existe:** nenhum item das próximas sprints vale a pena enquanto o backend não sobe de
forma confiável e não fica com fontes de verdade consistentes (saldo, categoria, erros). Fechar
isso primeiro evita construir feature nova em cima de terreno instável.

| # | Tarefa | Est. | Por quê | Status |
|---|---|---|---|---|
| 3.1 | Corrigir mismatch `cors.allowed.origins`/`origin` | 0,25h | Derruba o boot | Concluído |
| 3.2 | Completar env vars faltando no `docker-compose.yml` | 0,5h | Ambiente local (e possivelmente prod) quebrado | Concluído |
| 3.3 | Corrigir `CookieService` para usar a property, não a env var direta | 0,25h | Default morto, mais um ponto de falha | Concluído |
| 3.4 | Migration `V2` corrigindo `DEFAULT 'USER'` | 0,5h | Default de role incorreto |  Concluído |
| 3.5 | Corrigir `@ExceptionHandler` de `TransactionNotFoundException` | 0,25h | 404 virando 400 | Concluído |
| 3.6 | Null-safety em `transaction.getCategory()` + `LEFT JOIN FETCH` na listagem | 1,5h | Resolve NPE (2.1) e N+1 (5.1) juntos | Concluído |
| 3.7 | Separar `RuntimeException` genérica de erro 500 real no `GlobalExceptionHandler` | 0,75h | Erros de servidor mascarados como erro de cliente | Concluído |
| 3.8 | Corrigir status `204`→`404` no corpo de `AccountNotFoundException` | 0,1h | Inconsistência de contrato | Concluído |
| 3.9 | FK de `refresh_tokens.user_id` → `users.id` (nova migration) | 0,5h | Linhas órfãs | Concluído |
| 3.10 | Decidir escopo de multi-conta; travar ou implementar corretamente `AccountRepository` | 1–2h | Bug silencioso de sobrescrita de saldo se ativado sem correção | Concluído |
| 3.11 | Remover import morto (`OpenSSLCertificateVerifier`) | 0,05h | Limpeza | Concluído |
| 3.12 | Remover campo `kind` não usado de `CreateTransactionDTO`/`UpdateTransactionDTO` (avisar frontend) | 0,5h | Contrato de API enganoso | Concluído |
| 3.13 | Corrigir ou remover `CategoriesService.toDTO()` (campos trocados) | 0,25h | Bug latente | Concluído |
| 3.14 | Alinhar CHECK `'BOTH'` do banco com o enum `CategoryKind` | 0,5h | Inconsistência schema/código | Concluído |
| 3.15 | `X-Forwarded-For` no `RateLimitFilter` (config de proxy confiável) | 0,5–1h | Rate limit inefetivo atrás de proxy | Adiada |
| 3.16 | Limpar `RUN` de debug do `Dockerfile` | 0,15h | Build sujo/lento | Concluído |
| 3.17 | Trocar senha hardcoded do Postgres no compose por env var | 0,15h | Hábito de segurança | Concluído |

**Total Sprint 3: ≈ 8–11h**

---

## Sprint 4 — Fechamento do fluxo de transações + sessão

**Objetivo (do backlog de produto):** ciclo completo Criar → Visualizar → Detalhar → Editar →
Excluir, com sessão sobrevivendo à expiração do access token.

### 4.1 Frontend — Transações
| Tarefa | Est. |
|---|---|
| Edição de transação (form completo, loading, erro, tratamento de 401, atualização de UI) | 4–6h |
| Detalhes da transação (visualização + ações editar/excluir/voltar) | 2–3h |
| Exclusão (confirmação, loading, tratamento 401/404/403) | 2h |

### 4.2 Frontend — Prevenção de double-submit
| Tarefa | Est. |
|---|---|
| `isSubmitting` bloqueando botão/form durante requisição | 1–2h |

### 4.3 Backend — Proteção contra duplicação
| Tarefa | Est. | Nota |
|---|---|---|
| Janela curta de proteção/idempotência na criação de transação | 1–2h | Rate limit por minuto não resolve clique duplo na mesma requisição; considerar uma chave de idempotência ou uma checagem de "mesma transação nos últimos N segundos" |

### 4.4 Backend — Revisão de update/delete
| Tarefa | Est. | Nota |
|---|---|---|
| Confirmar autenticação, ownership, validação de DTO/conta/categoria, compatibilidade de `CategoryKind`, resposta HTTP consistente | 1h | Já auditado na Sprint 3 do backend — este item é checklist de confirmação, não trabalho novo |

### 4.5 Sessão — Refresh automático (principalmente frontend)
| Tarefa | Est. |
|---|---|
| Cliente HTTP centralizado com interceptor de 401 | 2–3h |
| Lock/promise único de refresh (evitar refresh concorrente de múltiplas requests) | 2–3h |
| Retry único da request original após refresh OK | 1h |
| `/auth/refresh` não deve dele mesmo disparar outro refresh | 0,5h |
| Logout automático em falha definitiva de refresh | 1h |

**Total Sprint 4: ≈ 17–24h**

---

## Sprint 5 — Dashboard funcional

**Objetivo:** remover intervalo hardcoded; todos os dados do dashboard respondem ao período
escolhido.

| Tarefa | Est. |
|---|---|
| Seletor de período (7/15/30 dias, 3/6 meses) | 2–3h |
| Estado central do período (evitar cada componente controlar o próprio intervalo) | 1–2h |
| Propagar `start`/`end` para `/dashboard/buildDashboard`, `/recentTransactions`, `/insightCards` | 2–3h |
| Loading/skeleton durante troca de período | 1–2h |
| Empty state e error state com retry | 1–2h |
| Backend: validar `start`/`end`, definir timezone, comportamento `start > end`, limite máximo de intervalo | 2–3h |
| Testar dashboard nos cenários (7/15/30d, 3/6m, sem dado, 1 dado, alto volume) | 1–2h |

**Total Sprint 5: ≈ 10–17h**

---

## Sprint 6 — Mobile + refatoração do frontend

**Objetivo:** produto deixar de parecer otimizado só para desktop; código do front sustentável.

| Tarefa | Est. |
|---|---|
| Revisão responsiva das 9 telas prioritárias (login, cadastro, dashboard, transações, criar, editar, detalhes, categorias, contas) | 8–14h |
| Modal de transação mobile (largura, teclado, scroll, botões, loading, erro, anti-duplo-submit) | 2–3h |
| Componentização (separar `components/hooks/services/types/utils`) | 4–8h |
| API layer centralizada (`services/auth`, `transactions`, `categories`, `accounts`, `dashboard`) | 3–5h |

**Total Sprint 6: ≈ 17–30h** (faixa larga — depende de quanto do frontend atual já está
componentizado)

---

## Sprint 7 — Autenticação completa + testes

**Objetivo:** fechar o ciclo de segurança da conta.

| Tarefa | Est. |
|---|---|
| Testes do `AuthService` (cadastro, login, senha inválida, usuário inexistente, refresh válido/expirado/revogado, rotação, logout, credenciais inválidas) | 3–5h |
| Frontend: fluxo de login/logout/refresh, redirecionamento, estado de sessão consistente entre páginas | 3–5h |
| Forgot password — backend (endpoint, token seguro, expiração, armazenamento, invalidação após uso, troca de senha) | 4–6h |
| Forgot password — frontend (2 formulários + estados) | 3–4h |
| Verificação de e-mail — backend (token, expiração, confirmação, invalidação) | 3–5h |
| Verificação de e-mail — frontend (tela, reenvio, feedback) | 2–3h |
| Revisão de logs (INFO/DEBUG/WARN/ERROR, nunca logar senha/refresh token/JWT completo) | 1–2h |

**Total Sprint 7: ≈ 19–30h**

---

## Sprint 8 — Banco, domínio e performance

**Objetivo:** melhorar o modelo sem otimização prematura.

| Tarefa | Est. | Nota |
|---|---|---|
| Definir fonte oficial do saldo (receitas − saídas − compromissos futuros) e implementar | 4–8h | É exatamente o item 2.3 da auditoria técnica — escolher entre calcular sempre via query/view ou manter coluna sincronizada nas próprias operações de transação |
| Revisar índices baseado em padrões reais de consulta | 2–3h | Não criar índice só porque a coluna existe |
| Investigar N+1 no Hibernate (dashboard, categorias, contas, transações) | 2–4h | Já identificado 1 caso concreto (categoria em listagem) na auditoria — corrigido na Sprint 3; usar esse padrão pra achar outros |
| Medir dashboard antes de otimizar (contagem de queries, tempo, volume) | 2–3h | Só decidir entre índice → query opt → projeções → agregação → cache depois de medir |
| Agregações (`daily_financial_aggregate`), condicional | sob demanda | Só se a medição comprovar necessidade — não implementar preventivamente |

**Total Sprint 8 (sem agregação especulativa): ≈ 10–18h**

---

## Sprint 9 — UX + identidade visual Opsire

**Objetivo:** transformar a interface de "sistema funcional" em produto.

| Tarefa | Est. |
|---|---|
| Loading states, skeletons, toasts de sucesso/erro, empty states, confirmações destrutivas | 4–6h |
| Traduzir respostas técnicas (401/403/404/409/500) em mensagens amigáveis ao usuário | 2–3h |
| Identidade visual (paleta mais escura/cinza, menos azul, visual financeiro não "banco tradicional") | 4–8h |
| Sistema visual padronizado (botões, inputs, cards, modais, tabelas, badges, tipografia, ícones, estados) | 6–10h |

**Total Sprint 9: ≈ 16–27h**

---

## Sprint 10 — Segurança + produção

**Objetivo:** preparar o sistema para usuários reais.

| Tarefa | Est. | Nota |
|---|---|---|
| Revisão final de CORS por ambiente (nunca `*` com credentials) | 0,5–1h | Correção principal já feita na Sprint 3; aqui é validação final em prod |
| Validar cookies em produção (HttpOnly/Secure/SameSite/Path) | 0,5–1h | idem |
| Rate limiting em endpoints adicionais (criação de transação, recuperação de senha, reenvio/verificação de e-mail) | 2–3h | |
| Checklist de autorização por endpoint (autenticado? recurso existe? pertence ao usuário? operação permitida?) | 2–3h | Já auditado majoritariamente na Sprint 3; usar como checklist de confirmação final |
| Validação (tamanho máximo, negativos, datas, enums, UUID inválido, paginação, payload excessivo) | 2–4h | |
| Padronizar `ErrorResponseDTO` entre todos os controllers | 1–2h | Parte resolvida na Sprint 3 |
| LGPD/legal (política de privacidade, termos de uso, consentimento) | 4–8h | Trabalho de conteúdo/jurídico, não só código |
| CI/CD (build → test → quality check → deploy, sem deploy automático quebrado) | 3–5h | |

**Total Sprint 10: ≈ 15–27h**

---

## Sprint 11 — SaaS / produto comercial

**Objetivo:** preparar o Opsire para usuários além do desenvolvedor.

| Tarefa | Est. |
|---|---|
| Definir free tier (recursos, limites, dados, funcionalidades básicas) | 3–5h |
| Definir escopo do plano pago (não implementar tudo de uma vez) | 2–4h |
| Landing page (proposta de valor, screenshots, benefícios, pricing, FAQ, CTA, privacidade, termos) | 8–16h |
| Onboarding (cadastro → configuração inicial → conta → categorias → primeira transação → dashboard) | 4–8h |

**Total Sprint 11: ≈ 17–33h**

---

## Sprint 12 — Backlog técnico transversal (contínuo)

Itens que devem acompanhar as sprints acima, não uma fila própria. A maior parte já está coberta
pelas sprints 3–10; o que sobra como trabalho residual:

- Documentação das variáveis de ambiente (checklist de `.env` de produção) — **1–2h**
- Revisão final de migrations (nenhuma editada após aplicada em prod) — checklist, **0,5h**
- Tipagem dos responses no frontend, se ainda não estiver 100% — **2–4h**

**Total Sprint 12 residual: ≈ 3,5–6,5h**

---

## Sprint 13 — Testes ponta a ponta prioritários

Antes de considerar o sistema "pronto", validar manual e/ou automaticamente:

| Fluxo | Est. |
|---|---|
| 1. Cadastro → login → dashboard | 1h |
| 2. Transação: criar → listar → detalhes → editar → ver alteração → excluir → confirmar remoção | 1–2h |
| 3. Sessão expirada: token expira → 401 → refresh → retry → sucesso | 1–2h |
| 4. Refresh inválido: 401 → refresh falha → logout → login | 1h |
| 5. Concorrência: clique múltiplo → frontend bloqueia → backend protegido → uma única operação | 1–2h |
| 6. Ownership: usuário A tentando acessar recurso do usuário B → acesso negado | 1–2h |

**Total Sprint 13: ≈ 6–10h**

---

## Definition of Done (herdado do backlog de produto)

Uma tarefa só conta como concluída quando:

- [ ] Backend implementado
- [ ] Frontend integrado
- [ ] DTO/API alinhados
- [ ] Autorização revisada
- [ ] Loading implementado
- [ ] Erro tratado
- [ ] Empty state tratado quando aplicável
- [ ] Mobile considerado
- [ ] Teste criado/atualizado quando necessário
- [ ] Sem regressão nos fluxos existentes
- [ ] Código commitado, build funcionando, deploy funcionando (quando aplicável)

---

## Regras de execução (herdadas do backlog de produto)

1. Não reescrever arquitetura sem necessidade.
2. Não criar abstrações apenas por antecipação.
3. Não adicionar Redis/agregações antes de medir.
4. Não mover regra de negócio para o frontend.
5. Não confiar em IDs de usuário enviados pelo frontend — sempre vem da sessão/autenticação.
6. Não alterar migrations já aplicadas em produção.
7. Não implementar frontend sem verificar o contrato real da API.
8. Não implementar backend sem considerar como o frontend vai consumir.
9. Ao alterar API/DTO, procurar imediatamente os consumidores frontend.
10. Ao alterar domínio/backend, verificar impacto em dashboard, transações e autenticação.
11. Priorizar correção de fluxos existentes antes de novas features.
12. Commits pequenos e semanticamente relacionados.

---

## Resumo de estimativas

| Sprint | Horas |
|---|---|
| 3 — Débito técnico de backend | 8–11h |
| 4 — Transações + sessão | 17–24h |
| 5 — Dashboard funcional | 10–17h |
| 6 — Mobile + refatoração frontend | 17–30h |
| 7 — Auth completa + testes | 19–30h |
| 8 — Banco, domínio, performance | 10–18h |
| 9 — UX + identidade visual | 16–27h |
| 10 — Segurança + produção | 15–27h |
| 11 — SaaS / comercial | 17–33h |
| 12 — Técnico transversal (residual) | 3,5–6,5h |
| 13 — Testes ponta a ponta | 6–10h |
| **Total** | **≈ 145–233h** |

Isso não é uma sprint de duas semanas — é o roadmap completo até "produto SaaS pronto para
monetizar". Pra um dev solo part-time (faculdade + freelas), dá pra pensar em blocos de 10–20h
por sprint ao longo de várias semanas, sem tentar comprimir tudo de uma vez — exatamente o
motivo de ter pedido pra dividir por sprints.
