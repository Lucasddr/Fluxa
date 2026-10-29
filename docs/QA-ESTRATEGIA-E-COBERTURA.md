# Opsire | Estratégia de QA e Plano de Cobertura

> **Tipo:** diagnóstico da suíte existente e plano de qualidade  
> **Data da análise inicial:** 20/10/2026  
> **Escopo:** repositório Opsire (nome técnico atual do repo: Fluxa), backend, frontend, CI, documentação do projeto e notas relevantes do Obsidian.  
> **Base inicial:** código no `HEAD 3af8bc2`, testes executados e registros consultados em 20/10/2026.

> **Atualização de implementação:** Fase 1 executada em 21/10/2026 sobre essa base. A suíte passou a 99 testes; escopo e evidências estão em [Atualização da Fase 1](#atualização-da-fase-1-21-10-2026).

---

## Sumário

1. [Resumo executivo](#1-resumo-executivo)
2. [Escopo e método](#2-escopo-e-método)
3. [Inventário da cobertura atual](#3-inventário-da-cobertura-atual)
4. [Lacunas e riscos](#4-lacunas-e-riscos)
5. [Matriz funcional de cobertura](#5-matriz-funcional-de-cobertura)
6. [Plano de testes proposto](#6-plano-de-testes-proposto)
7. [Priorização de implementação](#7-priorização-de-implementação)
8. [Critérios de entrada, saída e CI](#8-critérios-de-entrada-saída-e-ci)
9. [Evidências desta análise](#9-evidências-desta-análise)
10. [Referências](#10-referências)

---

## 1. Resumo executivo

Na linha de base de 20/10/2026, 78 testes backend passaram. Após a Fase 1 de 21/10/2026, a suíte tem **99 testes, todos passando**, incluindo novos testes HTTP de transações, categorias e importação. O backend cobre autenticação e tokens, compras parceladas, contas, saldo reconciliado, importação bancária e agora parte dos contratos HTTP financeiros.

O principal risco de qualidade é a diferença entre testar serviços com H2 e validar o produto integrado. A suíte não cobre a maioria dos controllers/contratos HTTP; o perfil de testes desativa Flyway e cria o schema pelo Hibernate; o frontend não tem runner nem testes automatizados de componentes; e os fluxos completos de browser descritos no vault ainda não são uma suíte executável no repositório.

### Estado resumido

| Camada | Estado observado | Avaliação QA |
|---|---|---|
| Backend - lógica/serviços | 72 testes em serviços e parser na linha de base | Boa base; Fase 1 acrescenta integração HTTP cobrindo novos fluxos financeiros |
| Backend - HTTP/integração | 26 testes MockMvc: 5 de erros de entrada + 21 financeiros; 1 de contexto | Cobertura melhor para transações/categorias/importação; contas, saldo, crédito/parcelas e dashboard seguem para Fase 2 |
| Banco/migrations | Testes correntes usam H2; Flyway desativado | V1-V12 não são validadas pelo job de teste do CI |
| Frontend | lint, TypeScript e build; sem arquivos ou scripts de teste automatizado | Sem regressão automatizada de componentes, serviços ou interações de UI |
| Sistema/E2E | Evidência manual recente documentada no vault | Fluxo valioso já validado, mas não reprodutível como gate do CI |
| Segurança | Catálogo de controles e regressões existente no Obsidian | Deve ser transformado em testes recorrentes e ampliado para as funcionalidades novas |

**Recomendação:** manter a suíte atual, fechar primeiro os contratos e casos negativos dos módulos financeiros, executar Flyway contra PostgreSQL no CI e adicionar uma suíte Playwright enxuta para os fluxos críticos. Complementar com testes unitários puros no frontend e validação de acessibilidade/responsividade como parte dos testes de sistema.

---

## 2. Escopo e método

Foram examinados:

- `backend/src/test/java` e `backend/src/test/resources/application-test.properties`;
- controllers, serviços, DTOs, funcionalidades e configurações de autenticação/importação;
- `backend/pom.xml`, `frontend/package.json` e `.github/workflows/ci.yml`;
- documentação existente em `docs/`, incluindo roadmap, requisitos, banco, decisões, deploy e diagnóstico;
- contexto do projeto, backlog, notas diárias, histórico de execução e regressões de segurança no Obsidian.

O estado da documentação é temporal: o roadmap e o diagnóstico no repositório contêm descrições de outubro anteriores à conclusão de multi-conta, reconciliação e importação. As notas do vault de 20/10/2026 e o código/testes atuais foram usados para resolver essas divergências. O documento registra apenas o que foi observado e separa evidência anterior de proposta futura.

O diagnóstico inicial foi seguido pela implementação parcial do plano aprovado. As seções identificam a linha de base de 20/10 e a atualização da Fase 1 de 21/10; os itens de fases posteriores permanecem propostas, não implementação concluída.

---

## 3. Inventário da cobertura atual

### 3.1 Backend: linha de base e cobertura atual

| Arquivo | Testes | Cobertura observada |
|---|---:|---|
| `AuthServiceTest` | 10 | Registro, e-mail duplicado, login válido/inválido, rotação/revogação/expiração de refresh token e criação de admin no serviço |
| `PasswordResetServiceTest` | 6 | Solicitação, não enumeração por ausência de envio, reset válido, token usado/inválido e login após reset |
| `EmailVerificationServiceTest` | 6 | Estado inicial, envio, verificação, token usado/inválido/expirado |
| `CreditPurchaseServiceTest` | 16 | Parcelas iguais/manuais, soma e contagem, categoria incompatível, pagamento, pagamento duplicado, atraso, edição e exclusão, ownership, idempotency key e projeção |
| `AccountManagementServiceTest` | 11 | Conta padrão, criação, unicidade case-insensitive, seleção de padrão, associação de transação/compra, exclusão protegida e ownership |
| `AccountBalanceServiceTest` | 9 | Observação manual, resolução, transações retroativas, revisão, projeção 7/30/90 e saldo disponível |
| `BankStatementParserTest` | 11 | CSV, débito/crédito, Windows-1252, cabeçalho precedido de texto, texto colado, PDF textual, OFX/FITID, datas e dados inválidos |
| `BankStatementImportServiceTest` | 3 | Prévia/CSV, importação única e deduplicada, regra de categoria, saldo OFX e duplicata no preview |
| `GlobalExceptionHandlerInputErrorsTest` | 5 | JSON inválido, parâmetro ausente, método não permitido, Content-Type e remoção de `/auth/test-500` |
| `BackendApplicationTests` | 1 | Carregamento do contexto Spring |
| `TransactionCategoryControllerIntegrationTest` | 11 | HTTP de transações e categorias: CRUD, validação, idempotência, categoria inativa, conflito de exclusão e isolamento A/B |
| `StatementImportControllerIntegrationTest` | 10 | HTTP de importação: opt-in `true`/`false`/ausente/`null`, campos/lista inválidos, categoria incompatível/alheia, autenticação, preview, formato e limites |
| **Total atual (21/10/2026)** | **99** | **99 passaram; 0 falhas, 0 erros, 0 ignorados** |

Os 72 casos da linha de base de serviço/parser usam `@SpringBootTest`; os casos de serviço exercitam persistência H2 e transações, portanto são mais próximos de testes de integração do domínio do que de testes unitários isolados. Os 11 casos do parser são unitários/de componente. Fase 1 acrescentou 21 testes MockMvc com autenticação via cookie JWT sintético e verificações de persistência; junto aos cinco anteriores, são 26 testes HTTP. A superfície completa da API ainda não está coberta.

### 3.2 Frontend e automação

- `frontend/package.json` contém `dev`, `build`, `start` e `lint`; não declara `test`/`test:e2e` nem dependências de Vitest, Jest, Testing Library, Playwright ou Cypress.
- Não foram encontrados arquivos `*.test.*`/`*.spec.*` nem diretório E2E no frontend.
- O CI executa testes Maven, TypeScript e build. O lint está configurado com `continue-on-error: true`, então não é um gate bloqueante, mesmo quando passa localmente.
- O vault registra um E2E autenticado local em 320px para login, importação CSV, deduplicação, saldo divergente e resolução; também registra smoke de API via nginx e validação real das migrations V1-V12. São evidências úteis, mas não há runner versionado para repetir esses cenários automaticamente.

### 3.3 Documentação existente

Já existem documentos de produto, requisitos, banco de dados, decisões de arquitetura, variáveis de ambiente, deploy, LGPD, diagnóstico e roadmap. A cobertura de QA estava distribuída em checklists históricos e no plano de regressão de segurança do vault. **Não havia um documento único no repositório que inventariasse a suíte atual, separasse os níveis de teste e cobrisse funcionalidade por funcionalidade.** Este documento consolida essa visão.

---

## 4. Lacunas e riscos

### Prioridade crítica

1. **Testes HTTP ainda não cobrem a maioria dos endpoints.** Fase 1 cobre fluxos selecionados de transações, categorias e importação; contas, saldo, compras, parcelas, dashboard e contratos completos de autenticação continuam sem cobertura equivalente.
2. **Cobertura de transações e categorias é parcial.** Os novos casos cobrem CRUD essencial, validação, ownership, idempotência, ativação/desativação e exclusão em uso; faltam paginação/filtros, mais limites e cenários de erro/concorrência.
3. **Migrations fora do job de testes.** `application-test.properties` define `spring.flyway.enabled=false` e `ddl-auto=create-drop`; a suíte atual não verifica a sequência real de Flyway nem as restrições do PostgreSQL.
4. **Sem E2E versionado.** O comportamento integrado frontend/API/sessão/importação pode regredir sem falhar no CI.

### Prioridade alta

5. **Frontend sem testes de unidade/integração.** Formatação monetária, parsing de valores, camada HTTP, refresh concorrente, modais, formulários, estados loading/empty/error e feedback do usuário não têm proteção automatizada no frontend.
6. **Validação de DTO não exercitada sistematicamente.** Existem constraints, mas faltam testes de fronteira e consistência para campos obrigatórios, limites, valores monetários, enum, datas, UUID e casos nulos/ausentes.
7. **Importação segue com cobertura parcial.** Fase 1 cobre contrato HTTP de opt-in, validação, categoria/ownership, preview vazio/inválido e limites de arquivo/linhas; restam seleção parcial completa, duplicatas concorrentes, PDF/texto corrompido em E2E e recuperabilidade visual.
8. **Regressão de segurança pouco automatizada.** A auditoria do Obsidian contém baseline `OPSIRE-CTRL-001..010`; parte foi verificada manualmente em 16/10 e precisa ser reexecutada no código atual, principalmente após multi-conta/importação e mudanças de produção.

### Prioridade média

9. **Assertividade desigual.** `CreditPurchaseServiceTest.emptyUpdateThrows` aceita qualquer `Exception`; substituir por tipo e mensagem/código de domínio esperados. Testes devem evitar verificações amplas que passam com erro não relacionado.
10. **Sem relatório de cobertura de código.** O Maven não configura JaCoCo; não há medida de cobertura por domínio nem política de qualidade por branch.
11. **Performance e concorrência sem gate repetível.** Idempotência, pagamento em simultâneo, deduplicação e rate limit necessitam testes sob requests concorrentes; consultas do dashboard/listagens precisam de limites de latência definidos após baseline.

---

## 5. Matriz funcional de cobertura

**Legenda:** `Parcial` = existe teste automatizado, porém não cobre a funcionalidade/contrato todo; `Manual` = há evidência no vault, não automatizada no repositório; `Proposto` = cobertura recomendada.

| Funcionalidade | Cobertura existente | Cobertura necessária |
|---|---|---|
| Registro e login | Parcial: regras de serviço e credenciais; sem controller/browser completo | DTO/validação, status/cookies, sessão, limite de tentativas, mass assignment e E2E cadastro-login |
| Refresh, logout e sessão frontend | Parcial: rotação no serviço; sem testes do interceptor | Tokens inválidos/reusados, cookies, refresh único sob concorrência, retry único e logout em falha via UI/API |
| Reset e verificação de e-mail | Parcial: fluxo de serviço, validade e uso único | Contrato HTTP, rate limit, expiração nos limites e garantia de que tokens nunca apareçam nos logs |
| Perfil/remoção de usuário | Sem testes funcionais identificados | GET autenticado, remoção transacional, FKs/retention e isolamento multiusuário |
| Transações CRUD | Parcial: novos testes HTTP para create/list/detail/update/delete, erros 4xx, idempotência e ownership A/B | Completar filtros/paginação, limites, mais combinações de conta/categoria e efeitos no dashboard |
| Categorias CRUD/estado | Parcial: novos testes HTTP para create/list/select/update/delete, ativar/desativar, categoria inativa e 409 em uso | Ampliar limites, persistência/histórico após exclusão bloqueada e fluxos de UI |
| Compras no crédito/parcelas | Parcial forte: 16 testes de serviço | Contratos HTTP, validação, concorrência no pagamento, edição ONE/FOLLOWING, ownership de toda rota e UI completa |
| Contas/multi-conta | Parcial forte: 11 testes de serviço | CRUD HTTP, comportamento default, restrições banco/concorrência e isolamento em todas as operações |
| Saldo/reconciliação | Parcial: 9 testes de serviço e evidência manual | API, valores/data nulos/limites, múltiplas observações, usuário A/B, reabertura de revisão e UI de resolução |
| Dashboard/insights | Parcial indireta via saldo e parcelas | Contrato de campos, períodos válidos/limites, agregações sem dupla contagem, estados vazios/erro e regressão frontend |
| Importação CSV/OFX/PDF/texto | Parcial: parser 11; serviço 3; 10 testes HTTP novos; E2E manual CSV anterior | E2E de preview/edição/seleção, duplicatas concorrentes, erro parcial/atomicidade, PDF/texto e fluxo por formato |
| Regras de sugestão de categoria | Parcial junto ao import service | Opt-in explícito, normalização, escopo por conta, categoria desativada e dados omitidos/nulos |
| Acessibilidade e responsividade | Manual documentado, inclusive 320px | Playwright + axe, teclado/foco/dialog, viewport 320/390/768/1440, temas e ausência de overflow |
| Privacy/Terms e rotas protegidas | Sem testes identificados | Renderização pública, navegação, proteção de páginas autenticadas e links funcionais |
| Configurações/relatórios/insights incompletos | Documentação histórica diverge do app atual; rotas presentes variam por branch | Decidir comportamento/escopo antes de escrever expectativa; testar apenas contratos e conteúdo entregues |

---

## 6. Plano de testes proposto

### 6.1 Testes unitários

**Objetivo:** validar regras puras com execução rápida, sem Spring, banco ou rede.

- **Dinheiro e parcelas:** divisão igual em centavos com resto distribuído; total sempre igual à compra; quantidades 1, 2, máximo permitido e inválida; soma manual abaixo/acima; valor zero/negativo/precisão maior que duas casas.
- **Saldo:** cálculo operacional, comprometido e disponível; não descontar duas vezes parcela paga; PENDING/OVERDUE e limites do horizonte; nunca contar receitas futuras como saldo atual.
- **Datas:** fronteiras start=end, start>end, 366 dias, 367 dias, leap day, timezone/ISO com offset e mudança de mês/ano em parcelas.
- **Importação:** normalização de descrição (acentos, pontuação, números, caixa), criação de referência estável, interpretação de sinais e valores BRL, detecção de cabeçalhos e mapeamento de categorias.
- **Parser:** parametrizar formatos reais sintéticos CSV com `,`/`;`, aspas, BOM, UTF-8/Windows-1252, cabeçalhos variados, CRLF, linhas vazias, débito/crédito; OFX SGML/XML, FITID ausente/repetido; PDF textual, PDF sem texto e arquivo não PDF; datas e montantes inválidos.
- **Frontend:** funções de `app/utils/math.ts`, `Formatters.ts`, `http.ts`, transformação de erros, construção de query params, parse/format de moeda com vírgula/ponto e valores extremos.
- **Segurança de helpers:** claims/expiração JWT, hashing de tokens, cookies por ambiente e política de CORS/rate limit por endpoint, quando isoláveis como lógica pura.

**Critério:** testes determinísticos, relógio injetável para expiração/vencimento e nenhuma dependência de `LocalDate.now()` não controlado nos casos de fronteira.

### 6.2 Testes de integração backend

**Objetivo:** provar integração Spring MVC → validação → security → service → repository → persistência e contrato HTTP.

Criar suítes `@WebMvcTest`/MockMvc para controllers e casos de integração com banco para:

1. **Auth:** register/login/refresh/logout/me; 201/200/204 esperados; cookies `HttpOnly`, `Secure`, `SameSite`, Path por ambiente; credenciais ausentes/inválidas, JSON malformado, origem CORS proibida, JWT inválido/expirado e refresh reutilizado.
2. **Transações:** create/list/detail/update/delete; body e paginação; `Idempotency-Key` ausente, repetida, expirada e concorrente; categoria INCOME/EXPENSE incompatível; categoria/conta de outro usuário; método de pagamento inválido; atualização e exclusão refletidas no dashboard.
3. **Categorias:** criar/listar/select/atualizar/ativar/desativar/excluir; 409 em categoria em uso; inativa não selecionável para novos lançamentos e ainda legível no histórico; page/size/ordenação e cap.
4. **Contas:** create/list/rename/default/delete; unicidade sem diferenciar caixa; não excluir última/em uso; promoção do novo default atômica; rejeição de UUID de outra pessoa.
5. **Compras e parcelas:** criação, listagem, detalhe, atualização e cancelamento; compra parcelada soma corretamente; edição `ONE`/`FOLLOWING`; pagar gera exatamente uma transação; segundo pagamento e requests simultâneas não duplicam transação; overdue, reprogramação e acesso de outro usuário.
6. **Saldo:** criar/listar observação e resolver em cada opção; conta/observação fora do tenant; divergência pendente sem lançamento automático; transação retroativa reabre revisão; idempotência/repetição e contrato dos campos da resposta.
7. **Dashboard:** autenticação, intervalo, `forecastDays` 7/30/90, período independente da projeção, zero transações, totais por tipo e ausência de dupla contagem após pagamento; contratos de `buildDashboard`, `recentTransactions` e `insightCards`.
8. **Importação:** preview de multipart CSV/OFX/PDF e texto colado; importação somente de linhas selecionadas; categoria e tipo válidos; deduplicação por conta e persistência entre chamadas; saldo OFX; regra de categoria apenas com opt-in; erro em item inválido sem importação inconsistente.
9. **Erros e limites:** DTO inválido retorna 400 estruturado; UUID/parâmetro/enum inválido não vira 500; tamanho acima do limite retorna 413/400 conforme contrato; método e media type incorretos; mensagens sem stack trace/PII.

**Banco de dados:** conservar H2 para testes rápidos, mas adicionar job de integração com PostgreSQL (Docker service ou Testcontainers) que execute Flyway V1-V12 do zero e valide constraints, índices únicos, concorrência, tipos/precisão e queries específicas. Testar upgrade de schema legado em fixture sintética separada. Não usar dados reais.

### 6.3 Validação de entradas e regras

Adotar tabelas parametrizadas para DTOs e rotas. Por campo, cobrir: válido mínimo/máximo; nulo; campo ausente; vazio; só espaços; valor abaixo/acima do limite; enum inválido; formato inválido; caracteres unicode; payload muito grande; precisão monetária; referências inexistentes; referência pertencente a outro usuário.

| Área | Casos de fronteira sugeridos |
|---|---|
| Registro/login | nome/email/senha vazios, e-mail malformado, duplicado, senha limite 7/8, role injetada no JSON |
| Transação | valor zero/negativo, precisão >2 casas, descrição 200/201, observação no limite, data, categoria incompatível, conta/categoria cross-tenant |
| Compra/parcelas | total e parcela positivos, título/merchant/notes no limite, quantidade inválida/limite, primeira data, lista manual ausente/vazia, soma/contagem divergentes |
| Categoria/conta | nome vazio, 100/101 caracteres, duplicidade case-insensitive, estado obrigatório, exclusão com dependentes |
| Dashboard | parâmetro faltando, `start > end`, 366/367 dias, horizonte inválido, página/size negativos e size maior que cap |
| Importação | arquivo vazio, MIME/extensão incompatíveis, arquivo maior que 5 MB, >5.000 linhas, texto colado no limite, PDF corrompido/sem texto, linhas malformadas, categoria inválida/inativa, `rememberCategoryRule` ausente/false/true/null |

**Defeito conhecido a cobrir primeiro:** notas de execução de 20/10/2026 registram que omitir `rememberCategoryRule` na API de importação pode resultar em 500 por conversão de `null` para `boolean`. Criar teste de contrato para campo omitido, `false`, `true` e `null`; o resultado esperado de omitido/null deve ser definido explicitamente como `false` ou 400, nunca 500. O campo não deve salvar regra sem opt-in.

### 6.4 Testes frontend: unidade e integração de componentes

**Proposta de stack:** Vitest + React Testing Library + `user-event`; MSW para simular API sem rede. A escolha deve ser confirmada antes de adicionar dependências.

- `services/api.ts`: 401 com refresh bem-sucedido e retry único; múltiplos 401 compartilham uma única chamada de refresh; refresh/logout nunca entram em loop; refresh inválido limpa sessão e redireciona.
- Serviços por domínio: URL, método, corpo, query params, credentials, headers e tratamento dos erros para accounts, transactions, dashboard, categories, imports e credit purchases.
- Formulários/modais: valores válidos/inválidos, mensagens acessíveis, bloqueio de double submit, cancelamento e confirmação de exclusão, modal fechando em Escape, foco restaurado.
- Loading/empty/error: skeleton durante carga, estado vazio com copy apropriado, erro recuperável por retry e dados após sucesso.
- Moeda e gráficos: zero, positivo/negativo conforme regra, decimal BRL, denominador zero sem NaN/Infinity e legendas não sobrepostas.
- Estado de importação: prévia, selecionar/desselecionar, editar campos, duplicata desabilitada, regra sugerida sem import automático, confirmação e erro recuperável.
- Conta/saldo: alternar default, saldo pendente vs aceito, escolher resolução, atualização coerente de cards sem recarregar dados indevidos.

### 6.5 Testes de sistema completo (Playwright)

**Objetivo:** validar fluxos reais entre browser, frontend, API e PostgreSQL isolado. Usar usuário/dados sintéticos, perfil de teste, reset previsível do banco e nenhuma credencial de produção.

1. **Onboarding:** registrar usuário → login → sessão em cookie → dashboard inicial com conta/categorias padrão.
2. **Transação:** criar receita e despesa → conferir lista e detalhes → editar → tentar submit duplicado → excluir com confirmação → dashboard reflete totais corretos.
3. **Categoria:** criar categoria → selecionar em transação → desativar e confirmar que some de novas opções → preservar histórico → bloquear exclusão em uso → excluir uma sem vínculos.
4. **Sessão:** access expirado → um refresh para requests concorrentes → retry da chamada; refresh expirado/revogado → logout e login; logout limpa cookies e impede novo acesso privado.
5. **Compras no crédito:** criar parcelas iguais e manuais → verificar soma e vencimentos → pagar → revisar criação de transação e saldo comprometido → atualizar uma/futuras → excluir compra.
6. **Multi-conta e reconciliação:** criar contas A/B, mudar default, lançar em cada conta; observar saldo divergente, manter pendente, resolver por saldo observado e por ledger, inserir movimento retroativo e confirmar reabertura.
7. **Importar extrato:** CSV/OFX/PDF textual e texto colado → prévia → selecionar/editar/categorizar → importar → repetir fonte → duplicatas sinalizadas; conferir saldo OFX, regras de categoria opt-in e recuperação do erro.
8. **Dashboard:** alterar intervalo e projeção 7/30/90 independentemente; vazio, falha de API, retry, métricas e transações recentes.
9. **Rotas públicas/privadas:** privacy/terms carregam sem login; home financeira exige sessão; páginas de login/registro/reset/verificação têm sucesso e falhas compreensíveis.

Executar em Chromium como gate inicial; adicionar Firefox/WebKit se o suporte-alvo justificar. Cobrir viewport 320, 390, 768 e 1440px; light/dark; teclado/foco; axe-core para violações automatizáveis. Capturas de tela podem apoiar diagnóstico, não substituir asserts semânticos.

### 6.6 Segurança, resiliência e performance

- Automatizar os controles `OPSIRE-CTRL-001..010` do vault como testes determinísticos onde for adequado: tenant/IDOR, JWT `alg=none`/assinatura/expiração, cookies/CORS/CSRF, refresh/reuso, rate limit, cap de paginação/período, injeção, mass assignment, proteção de token no frontend e token de reset single-use.
- Expandir isolamento A/B a contas, observações, extrato/preview/import, regras de categoria, compra e parcelas; validar GET/PATCH/DELETE e criação com referências do outro usuário.
- Testar ausência de tokens e extratos em logs usando appender capturado, sem escrever dados sensíveis no próprio relatório.
- Testar upload malformado, limite de tamanho/linhas, concorrência de import, chamadas simultâneas ao pay e double-submit de transação.
- Fazer teste de carga controlado de autenticação, lista paginada e dashboard com volume sintético; estabelecer baseline e SLO antes de criar thresholds rígidos.
- Fazer smoke pós-deploy em staging para migrations, login/cookies, dashboard, fluxo financeiro e importação; nunca executar mutações financeiras de teste na produção.

---

## 7. Priorização de implementação

| Fase | Entrega | Prioridade | Critério de conclusão |
|---|---|---|---|
| 1 | Corrigir/definir contrato `rememberCategoryRule`; testes de validação para import DTO e upload; suíte HTTP mínima para transações/categorias | P0 | Erros inválidos retornam 4xx; CRUD financeiro principal protegido por testes HTTP |
| 2 | Cobrir controllers de contas, saldo, crédito/parcelas e dashboard; expandir ownership A/B | P0 | Todos os endpoints financeiros têm casos feliz, negativo e tenant |
| 3 | Testes de migração e integração PostgreSQL real com Flyway V1-V12 | P1 | CI cria schema do zero e valida banco alvo sem dependência de estado local |
| 4 | Vitest/RTL/MSW para helpers, camada HTTP, formulários e estados críticos | P1 | Regras frontend e sessão não dependem apenas de QA manual |
| 5 | Playwright: auth, CRUD transação/categoria, sessão, crédito, saldo/importação | P1 | Fluxos críticos reprodutíveis no CI com dados isolados |
| 6 | Acessibilidade/viewport, controles de segurança, logs sanitizados, concorrência e performance baseline | P2 | Regressões críticas têm evidência automática e relatório sanitizado |

Começar com smoke E2E pequeno e confiável; ampliar o conjunto depois de estabilizar fixtures, seed e teardown. Não bloquear CI com testes visuais frágeis antes de definir imagens/browsers/fontes controladas.

---

## 8. Critérios de entrada, saída e CI

### Definition of Ready para cada caso

- Regra/contrato definido, inclusive status HTTP, resposta e mensagens relevantes.
- Pré-condições e dados sintéticos independentes de estado compartilhado.
- Resultado verificável por assert, não por inspeção visual isolada.
- Para cenários negativos, confirmar estado persistido e ausência de efeitos colaterais.
- Para recursos protegidos, declarar usuário A/B e o proprietário esperado do recurso.

### Definition of Done

- Testes de unidade para regras puras e integração para persistência/HTTP alteradas.
- Um teste negativo para cada validação/autorização nova e um cenário de regressão para cada bug corrigido.
- Migrations validadas por Flyway em PostgreSQL isolado quando houver mudança de schema.
- Fluxo frontend afetado coberto por teste de componente ou Playwright conforme risco.
- Sem segredo, token, dado financeiro real ou PII nos fixtures/artefatos.
- `mvnw test`, lint bloqueante, `tsc`, build e E2E de smoke verdes.

### Pipeline recomendado

1. **Pull request - rápido:** Maven tests H2; lint bloqueante; TypeScript; testes Vitest; build frontend.
2. **Pull request - integração:** PostgreSQL service/Testcontainers + Flyway do zero + MockMvc/integração de repositórios.
3. **Pull request - E2E:** Playwright Chromium para smoke auth/transação/dashboard; suite maior para os módulos alterados.
4. **Agendado/pré-release:** suite E2E completa, controles segurança, dependências/SCA, acessibilidade, performance leve e relatório.
5. **Staging pós-deploy:** smoke autenticado sem PII e verificação de migrations/cookies/contrato. O ambiente de produção não deve ser usado como alvo de testes mutáveis.

**Gates atuais que devem mudar:** tornar lint bloqueante depois de corrigir a dívida existente; separar testes de teste unitário/integração no nome e no relatório; configurar timeout e artefatos sanitizados; manter secrets exclusivos de CI/staging.

---

## 9. Evidências desta análise

Execuções feitas em 20/10/2026 na árvore de trabalho corrente:

| Comando | Resultado |
|---|---|
| `backend`: `.\mvnw.cmd -B test` | **78 testes; 0 falhas; 0 erros; 0 ignorados; BUILD SUCCESS** |
| `frontend` (cwd): `npm run lint` | Passou |
| `frontend` (cwd): `npx tsc --noEmit` | Passou |
| `frontend` (cwd): `npm run build` | Passou; Next.js gerou as rotas existentes |

O vault registrava 73 testes verdes em uma execução anterior no mesmo dia. A contagem desta análise deriva da suíte presente agora (78 métodos `@Test`) e foi confirmada por nova execução. A diferença é compatível com testes adicionados depois do registro anterior; os cinco casos adicionais não foram presumidos, foram localizados nos arquivos atuais e incluídos na contagem acima.

**Não executado nesta análise:** PostgreSQL/Flyway do zero, Playwright, smoke em produção, teste de carga e auditoria completa dos controles `OPSIRE-CTRL-*`. Os testes de migrations e o E2E 320px descritos na matriz são evidências anteriores registradas no vault, não execuções repetidas aqui.

### Atualização da Fase 1 (21/10/2026)

Achados confirmados e correções aplicadas:

- `rememberCategoryRule` passou de `boolean` primitivo para `Boolean` opcional. `null` e ausência significam opt-out; somente `true` grava regra. O comportamento foi testado pelo controller e pelo estado persistido. A hipótese histórica de HTTP 500 não foi reproduzida nesta execução; a Fase 1 fixa o contrato e garante que as quatro variantes sejam seguras.
- Referência de categoria alheia na criação de transação agora usa `CategoryNotFoundException` e retorna 404, em vez de exceção genérica/500.
- Categoria inativa não pode ser usada para criar nova movimentação; `/categories/select` continua omitindo-a, reativação a torna disponível novamente e o histórico não é removido.
- A assertion de update vazio de parcela agora exige `InvalidInstallmentOperationException` e confere a mensagem específica.
- Adicionados 21 testes MockMvc, transacionais em H2, com JWT sintético em cookie. Eles verificam resposta HTTP, persistência/ausência de efeitos colaterais e isolamento A/B.
- Importação mantém os limites já existentes: 5 MB por arquivo e 5.000 linhas. Os testes verificam o status atual 400 e o corpo padronizado para excesso de arquivo/linhas; não alteram esses limites.

**Comandos desta fase:** `backend` (cwd): `.\mvnw.cmd -B test` (99 testes, 0 falhas/erros/skips); `frontend` (cwd): `npm run lint`, `npx tsc --noEmit` e `npm run build` (todos passaram). A execução direcionada dos 37 casos relevantes também passou. `git diff --check` passou; apenas avisos normais de conversão LF/CRLF do Git.

**Próxima fase recomendada:** Fase 2 do plano anexado - testes HTTP para contas, saldo, compras/parcelas e dashboard, ampliando ownership A/B nas respectivas famílias. Nesta etapa não foi iniciado o trabalho da Fase 2.

### Atualização da Fase 2 (21/10/2026)

Foram adicionados 42 testes de integração HTTP (MockMvc transacional sobre H2, JWT sintético, mesmo padrão da Fase 1), com suporte compartilhado em `HttpIntegrationTestSupport` (registro de usuários reais via `AuthService`, cookie assinado, asserções de valor decimal independentes de escala e de datas tolerantes ao formato de serialização).

- `AccountBalanceHttpIntegrationTest` (17): autenticação obrigatória; usuário novo começa com "Principal" (BRL, default); criação de contas custom não default; nomes inválidos 400 sem persistir; nome duplicado case-insensitive 409; renomeação e troca de default persistidas; exclusão bloqueada (409) por transação, por observação de saldo e por compra parcelada; última conta não excluída (mensagem específica); exclusão de conta default promove outra; proteção entre usuários 404 em leitura, PATCH, PUT default e DELETE; resumo de saldos lista apenas as contas do chamador (`NOT_RECONCILED` na primeira visita).
- Fluxo de conferência de saldo: data futura 400 (mensagem específica), mais de 2 casas 400, corpo incompleto 400; observação manual cria `PENDING_REVIEW` com diferença observada, sem criar transações; quando observação = ledger, virá `RECONCILED` sem revisão pendente; resolver exige opção (400 com corpo vazio), observação inexistente 404, e resolver duas vezes 400 ("Esta conferência já foi resolvida."); após aceite da observação, saldo corrente passa a 1500,00 e confiança `USER_ACCEPTED`.
- `CreditPurchaseInstallmentHttpIntegrationTest` (18): divisão igual com resíduo na última parcela (100,00/3 → 33,33+33,33+33,34) e vencimentos mensais; parcelas manuais persistidas como informadas; divergência de soma/quantidade 400 ("Soma das parcelas deve ser igual ao valor total da compra"); validações de título/quantidade/valor/observações 400; categoria alheia 404, categoria INCOME 400, categoria inativa 400; conta alheia 404 e fallback para conta padrão quando `accountId` é nulo; pagamento gera transação `CREDIT`/`EXPENSE` com descrição "Título - parcela n/qty" e vencimento no dia; pagamento repetido 409 (com ou sem a mesma Idempotency-Key) sem duplicar lançamentos; chave de idempotência acima de 36 caracteres 400; PATCH da compra recategoriza lançamentos já gerados; DELETE remove compra, parcelas e transações geradas (404 depois); atraso refresh para `OVERDUE` e reagendamento restaura `PENDING`; regras de update de parcela (vazio 400, FOLLOWING com valor 400 "accepta apenas mudança de vencimento", parcela paga 409, mudança de valor atualiza total da compra para 350,00); escopo FOLLOWING desloca todos os vencimentos abertos; filtro por intervalo de datas; isolamento A/B completo; compra bloqueia exclusão da conta.
- `DashboardHttpIntegrationTest` (7): autenticação obrigatória; validação de intervalo (start > end e intervalo > 366 dias com mensagens específicas; parâmetro ausente usa o corpo padronizado; LocalDate malformado 400); horizontes apenas 7/30/90; agregação real: entrada 250,00, despesas 80,00, saldo do mês 170,00, contas a pagar 240,00 (parcelas manuais dentro do horizonte), saldo corrente 170,00 e saldo disponível -70,00 (contrato: 170 - 240); estado de conferência reflete no dash (`NOT_RECONCILED` → `PENDING_REVIEW` com 1 revisão e diferença 900,00 → resolvido → `USER_ACCEPTED` com saldo 900,00 e diferença 0,00); recentTransactions paginado (10 por página) com validação de intervalo opcional "informados juntos"; insightCards responde 200 autenticado.

**Comandos desta fase:** suítes direcionadas `.\mvnw.cmd -B '-Dtest=...' test` (35 e depois 7 casos); suíte completa backend `.\mvnw.cmd -B test` com **141 testes, 0 falhas/erros/skips** (base da Fase 1: 99); frontend `npm run lint`, `npx tsc --noEmit`, `npm run build` passaram. `git status` mostra apenas os testes novos + alterações já conhecidas da Fase 1; nenhum código de produção foi alterado nesta fase.

**Achados/decisões desta fase:** (1) retry de pagamento com a MESMA Idempotency-Key retorna 409 (interpretado como "parcela paga"); não cria duplicado, mas não é idempotência HTTP amigável no retry - comportamento registrado como contrato atual, debate de UX/reposição pendente. (2) "Contas a pagar" do dashboard soma parcelas `PENDING/OVERDUE` com vencimento até o horizonte, sem limite inferior de data - parcelas atrasadas antigas contam sempre. (3) Chave de idempotência é validada em 36 caracteres - testes usam chaves curtas determinísticas. (4) `recentTransactions` do dashboard é paginado (máx. 10), não uma lista simples.

**Próxima fase recomendada:** Fase 3 do plano anexado - PostgreSQL + Flyway executando na CI para eliminar a diferença dialeto/schema do H2, antes de Playwright (Fase 5). Aguarda revisão do usuário antes de iniciar.

### Atualização da Fase 3 (22/10/2026)

A suíte não mudou: os 141 testes existentes passaram a ser executáveis em duas bases com o mesmo perfil `test`. As lacunas de dialeto e de migrations (gap 3 do inventário) foram fechadas com provisionamento externo - nenhum interlocutor novo no Maven, nenhuma dependência nova no pom.

- `backend/src/test/resources/application-test.properties`: o perfil `test` agora resolve datasource/Flyway/`ddl-auto`/dialeto por variáveis `TEST_*` com **defaults idênticos ao H2 anterior** (placeholders `${VAR:default}`). H2 segue o gate padrão local e CI.
- `.github/workflows/ci.yml`: novo job **gate bloqueante** `backend-postgres` (PostgreSQL 17 via service container `postgres:17`, mesmo dialeto do Supabase): `TEST_FLYWAY_ENABLED=true` + `TEST_DDL_AUTO=validate` → Flyway V1-V12 aplica as migrations de verdade e o Hibernate valida que cada entidade corresponde ao schema migrado. O job H2 (`backend`) é mantido.
- `docker-compose.test.yml` (novo, separado): mesmo PostgreSQL 17 descartável localmente na porta 15432 (`docker compose -f docker-compose.test.yml up -d --wait`), sem volume - `down` zera o banco. O `docker-compose.yml` original (stack E2E local: postgres dev + backend + nginx) permanece intocado.

**Comandos desta fase:** `backend` (cwd) com env `TEST_*` → `.\mvnw.cmd -B test`: **141/141** contra `[PostgreSQL] 17.11` (Flyway migrou V1-V12 na primeira execução e validou nas subsequentes); **segunda execução na MESMA base persistente → 141/141** (a suíte é in-place re-executável, sem dados residuais entre contexts); sem env → **141/141** em H2 (nada quebrou); `docker compose -f docker-compose.test.yml up -d --wait` → healthy. `git diff --check` passou.

**Achados/decisões desta fase:** (1) zero divergência de dialeto: as 63 queries HTTP + queries nativas (`TransactionRepository`) e as 78 unitárias se comportaram idênticas entre H2 `MODE=PostgreSQL` e PostgreSQL 17 rodando migrations reais; (2) `ddl-auto=validate` contra schema Flyway não acusou nenhum mismatch de entidade/coluna - entidades e migrations V1-V12 estão sincronizadas neste HEAD; (3) o placeholder `${VAR:default}` no `application-test.properties` evita um perfil novo, testes e workflow não divergem de configuração; (4) descobriu-se que o compose original da raiz é o stack E2E de 20/10 - o serviço de teste foi isolado em arquivo próprio para não sobrescrevê-lo.

**Item do inventário fechado:** "Testar Flyway V1-V12 em PostgreSQL isolado no CI; H2 não substitui validação do banco de destino" - agora na CI e localmente.

### Atualização da Fase 4 (22/10/2026)

O frontend ganhou runner e suíte própria (gap 4 do inventário): **vitest + @testing-library/react**, `npm test`, 6 arquivos, **39 testes, 0 falhas**. Nenhum código de aplicação alterado - apenas infraestrutura de teste.

- `vitest.config.ts` + `vitest.setup.ts` (jsdom; `NEXT_PUBLIC_API_URL` fornecida no setup antes do import de `services/api.ts`, que lança em tempo de módulo sem ela).
- `tsconfig.json`: `"types"` para `vitest/globals` + `jest-dom`; o `vitest.config.ts` sai do programa do Next (`exclude`) porque os tipos `@vitejs/plugin-react`(rollup) conflitam com o rolldown embutido do Next 16 - caso contrário, `tsc --noEmit` e `next build` quebram.
- `app/utils/Formatters.test.ts`: `formatCurrency` (pt-BR usa **NBSP** entre `R$` e o número - normalização na asserção) e todos os ramos de `formatPaymentMethod`.
- `app/utils/math.test.ts`: guard anti-zero de `getPercentage` (total 0 nunca gera NaN) e arredondamento.
- `app/utils/http.test.ts`: mapa completo de `friendlyHttpError` (400/401/403/404/409/422/429/5xx/default) e `HttpError` (status, mensagem, default).
- `services/api.test.ts` (happy-dom para stub de `window.location`): 9 casos da sessão - não-401 direto; 401 em rotas de autenticação nunca dá refresh (credencial, não expiração); bypass cobre query string; 401 → refresh ok → retry único; segundo 401 não re-loop; refresh falho → sem retry + `location.replace("/login")`; já em `/login` não redireciona; **401 concorrentes compartilham 1 refresh** (Sprint 4.5b); FormData não recebe Content-Type JSON.
- `services/transactions.test.ts`: camada por domínio - URLs/métodos/headers, `Idempotency-Key` só quando passado.
- `app/components/ui/CurrencyInput.test.tsx`: `formatBrlInput` (vírgula separa decimal, ponto é ruído - contrato real documentado; 2 casas; negativo; zeros dianteiros), `formatAmountValue` (2 casas, negativo, não-finito → ""); componente com wrapper controlado (`useState`) digita "1500,90" → "1.500,90"; `EmptyState` (defaults + props + ação) e `ErrorState` (`role=alert` + retry chamado).

**Comandos desta fase:** `npx vitest run` → **39/39 (6 arquivos)** duas vezes (antes e depois dos ajustes de tsconfig); backend `.\mvnw.cmd -B test` → 141/141; frontend `npm run lint` (0 erros; 5 warnings pré-existentes), `npx tsc --noEmit` → OK, `npm run build` → prerender completo. Nada foi commitado.

**Achados/decisões desta fase:** (1) vitest 5 exige `@types/node@26` (peer) - instalada a linha 3.2.x compatível com `@types/node@^20`; (2) o conflito rollup×rolldown precisa do exclude do config de teste no tsconfig do Next; (3) `toString` de BRL no Node insere espaço não-separável (NBSP) - testes normalizam; (4) o handler de sessão usa `window.location.replace`, testado por stub do `window.location` em `happy-dom` (jsdom não permite redefinir); (5) input controlado sem re-render: userEvent.type nesse padrão sobrevive apenas ao último caractere - os testes usam wrapper com `useState`.

**Item do inventário fechado:** "Implementar testes frontend para helpers, serviços HTTP, sessão/refresh, formulários e loading/empty/error" - coberto por 39 testes; restam testes de .page (dashboard/filtros) se desejado depois da Fase 5.

**Próxima fase:** Fase 5 do plano anexado - Playwright E2E sobre o stack local (compose E2E + constraints de viewport 320/390/768/1440). Em andamento na mesma sessão, a pedido do usuário.

---

### Atualização da Fase 5 (26/10/2026)

O projeto ganhou suíte **E2E Playwright** de ponta a ponta sobre o stack local real (gap 5 do inventário): **14 testes, 0 falhas**, `@playwright/test` 1.64.1, Chromium headless. Nenhuma linha de código de aplicação alterada - infraestrutura de teste + uma correção de configuração da stack (bug real encontrado pelo E2E, ver abaixo).

**Arquitetura da suíte** (`frontend/playwright.config.ts` + `frontend/e2e/`):

- **webServer array**: o compose raiz (`docker-compose.yml`: postgres dev + backend :8080 + nginx :80) sobe com `--wait`; o dev server Next sobe em :3000; `reuseExistingServer: true`. O app navega `http://localhost` (`.env.local` `NEXT_PUBLIC_API_URL=http://localhost/api` → proxy nginx). O comando do compose roda num wrapper PowerShell que ignora exit codes transitórios do Docker (engine recém-reiniciado) e só devolve 0 quando a porta 8080 responde (poll TCP).
- **`global-setup.ts` + `sessions.ts`**: o backend tem rate limit de **3 registros/min por IP** (bucket4j, refill ~1 token/20s). Registro não é algo que a suíte pode fazer 14× por minuto. Cada spec-file de dados (transactions/credit/balance/import) cria **um** usuário no `beforeAll`/globalSetup (espaçados 30s) e distribui a sessão aos testes via `storageState`; o `auth.spec` é o único com 3 registros (a própria suíte faz o pacing). Os arquivos de estado vivem em `test-results/session-state/` - o Playwright limpa `test-results/` a cada run, logo **cada execução usa usuários novos** (isolamento total entre runs; custo: ~2min de setup).
- **Idempotência entre runs**: títulos, categorias e o CSV importado carregam timestamp único por execução (categoria duplicada e CSV duplicado dariam 409/dedupe); o teste de saldo resolve **todas** as pendências acumuladas; a lista de transações cresce sem quebrar seletores (botão "Nova"/"Nova transação" casado por `.or().first()`).

**Os 14 testes** (`frontend/e2e/`):

- `auth.spec.ts` (4): registro → status "Conta criada com sucesso" → redirect /login; login → cookies **access_token + refresh_token** (path `/api/auth`) → logout via menu Radix (role=menuitem) **com asserção de resposta 200** → re-login; senha errada → alert + permanece; rota protegida sem sessão → /login.
- `transactions-crud.spec.ts` (4): despesa com **categoria criada inline** ("+ Criar nova categoria de despesa" → CategoryModal "Criar categoria"); submit vazio mostra validação; **edição pelo menu da linha** (menu escopado à linha do título via xpath `ancestor::*[.//button[@aria-label='Opções da transação']]`); **exclusão pelo menu da linha** (diálogo escopado, `toContainText(título)` garante a transação certa, espera o DELETE via `waitForResponse` antes de asserir contagem 0).
- `credit-purchase.spec.ts` (2): compra 2×45,00 com "Iguais (automático)" aparece na lista; **"Diferentes (manual)"** com soma 60+20≠100 bloqueia o salvamento ("A soma (R$ ...) deve ser igual ao total (R$ ...)").
- `balance.spec.ts` (2): informar R$ 1.234,56 → seção "Saldos pendentes de revisão" com diferença; **resolver todas as pendências** com "Usar saldo informado como base" (loop até zerar, cada resolve aguardado via `waitForResponse` de `.../resolve`) → dashboard mostra "Base escolhida por você" (USER_ACCEPTED).
- `import.e2e.spec.ts` (2, viewport 390×844): CSV gerado por run (`data;descricao;valor`, datas dinâmicas, valores "48,90") → "Ver prévia" → linhas como **inputs editáveis** (`input[id^='statement-description-']`) → "Importar 2 movimentações" → "Importação concluída" → transações na lista (conferidas em desktop 1280 porque em 390px a descrição fica `hidden`); reimportar o mesmo arquivo → linhas "Duplicada ou já importada; será ignorada" (checkbox disabled) + botão "Importar 0 movimentações" **disabled** - o dedupe é exercitado na UI, sem depender do texto do toast.

**Bug real encontrado pelo E2E (e corrigido na stack):** `POST /api/auth/logout` retornava **400 systematicamente atrás do proxy nginx**. Causa: o `CookieService` grava o `refresh_token` com `Path=/auth` (default de `cookie.refresh.path`), mas o caminho **público** via proxy é `/api/auth/*` - o navegador nunca envia o cookie para `/api/auth/logout`, e o `AuthController` exige `@CookieValue("refresh_token")` (sem ele → 400). Consequências reais: (a) "Sair" não encerra a sessão - os cookies continuam válidos (o frontend redireciona para /login mesmo com o erro, mascarando o bug); (b) o **refresh de sessão** (`POST /api/auth/refresh`) também nunca recebe o cookie via proxy - após os 15 min de vida do access_token a sessão morreria silenciosamente. Correção aplicada: `backend/.env.docker` `COOKIE_REFRESH_PATH=/api/auth` (o path é atributo do cookie, avaliado pelo navegador contra a URL pública; o nginx repassa o header Cookie sem reescrever). Os testes de auth agora **exigem** logout 200 e os dois cookies - não mascaram a falha. O mesmo alinhamento precisa ser garantido em qualquer ambiente que sirva a API sob prefixo (produção).

**Outros achados de contrato desta fase:** (1) o select "Conta" pré-seleciona "Principal (padrão)" - selecionar por índice 1, não por label "Principal"; (2) `getByLabel` casa por substring - "Categoria" também acerta "Categoria (despesa)" e o filtro "Filtrar por forma de pagamento" da página (usar `{ exact: true }` ou escopar ao diálogo); (3) o label "Parcelas (1-120)" renderiza travessão tipográfico (en-dash) no DOM - casar por regex `/Parcelas \(/`; (4) o usuário novo já nasce com categorias default "Mercado"/"Educação" e o modal de crédito **não** tem opção inline de categoria (usa as existentes); (5) menus Radix expõem itens como `role=menuitem`, não `button`; (6) a prévia de extrato pagina e usa `input` por linha (não `getByText`); (7) após salvar/importar, navegação imediata pode cortar requisições em voo - `waitForResponse` registrado **antes** do clique.

**Comandos desta fase:** `npx playwright test` → **14/14 (3-4,6min/run; últimas 2 rodadas completas verdes)**; gates de regressão re-validados: backend `./mvnw test` → **141/141** (nota: o filtro `'-Dtest=*IT,*Test'` exclui `BackendApplicationTests` e roda 140 - usar `./mvnw test` para o total); frontend `npm run test` → 39/39; `npm run lint` → 0 erros (5 warnings pré-existentes); `npx tsc --noEmit` → 0; `npm run build` → prerender completo. Nada commitado.

**Itens do inventário fechados:** "E2E críticos (auth, transações, importação, saldo, crédito)" e "rodar o stack completo local (docker compose) antes de cada release" - o `npx playwright test` agora faz exatamente isso com um comando.

**Próxima fase recomendada:** Fase 6 do plano (revisão/decisões) - revisar os deltas das fases 1-5 com o usuário e decidir pendências estruturais (ex.: `COOKIE_REFRESH_PATH` em produção, job E2E no CI, provedor de e-mail).

### Atualização da Fase 6 (27/10/2026)

Revisão de fechamento sobre as fases 1-5 e correções de segurança que ainda estavam abertas no código:

- **Rate limit atrás de proxy (OPSIRE-CTRL-005) corrigido.** O `RateLimitFilter` usava `request.getRemoteAddr()`, que atrás do nginx/Render devolve o IP do proxy - todos os usuários compartilhavam o mesmo bucket (na prática, 3 registros ou 5 logins por minuto para o site inteiro). `application.properties` agora define `server.forward-headers-strategy=native`; o Tomcat aceita `X-Forwarded-For` apenas de proxy interno e passa a expor o IP real. Dois testes novos provam o comportamento: um unitário do filtro e um de integração com servidor real e header encaminhado.
- **Cobertura de rate limit ampliada:** `POST /accounts/{id}/statement-imports` (10/min), `preview` e `preview-text` (20/min, bucket compartilhado) e `POST /accounts/{id}/balance-observations` (20/min). Antes, só autenticação, transação, compra e pagamento tinham limite.
- **SEC-003 (credencial hardcoded) resolvido no código rastreado:** `docker-compose.yml` e `backend/docker-compose.yml` usam `${POSTGRES_PASSWORD:-fluxa_local_dev}`; a credencial antiga foi rotacionada no volume local e as referências nos docs foram trocadas pelo estado corrigido (`ANALISE-DO-PROJETO`, `DIAGNOSTICO-MVP`, `ROADMAP-FECHAMENTO-PENDENCIAS`, `VARIAVEIS-AMBIENTE`, auditoria técnica). Nenhum segredo real foi adicionado.
- **Headers de segurança no frontend:** `next.config.ts` envia `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` e HSTS em todas as rotas. CSP estrita continua pendente: o bootstrap inline de tema em `app/layout.tsx` exige nonce/hash e uma estratégia validada, então não foi aberta exceção `unsafe-inline`.
- **Lint virou gate bloqueante no CI.** A dívida de warnings foi zerada (incluindo os testes novos); o workflow agora roda `npm test` (Vitest) e `npm run lint` sem `continue-on-error`, além dos jobs H2 e PostgreSQL/Flyway.
- **Docs de status corrigidos:** `/auth/test-500` foi removido e `/auth/registerAdmin` já exige `ROLE_ADMIN`; o diagnóstico que dizia o contrário foi atualizado.

**Verificação desta fase:** backend `.\mvnw.cmd -B test` → **147/147** (141 anteriores + 6 de rate limit); frontend `npm test` → **39/39**, `npm run lint` → 0 erros/0 warnings, `npx tsc --noEmit` → OK e `npm run build` → prerender completo. `git diff --check` limpo.

**Complemento 2026-10-28 (CTRL-010):** `LogTokenLeakRegressionTest` fecha o teste de regressão do SEC-001 — falha se um token de reset/verificação aparecer em qualquer log da aplicação. Tem um autocontrole que planta um token no log e exige que o detector o encontre, para o teste não passar por appender quebrado. Verificado em vermelho (reintroduzir o log do token faz o teste falhar) e em verde. Backend passou a **151/151**. Também entrou `scripts/smoke-prod.mjs`: smoke de produção sem dependências que falha em qualquer 5xx, confere CORS permitido/negado, rota protegida, login inválido, JSON malformado, `refresh` sem cookie, headers de segurança do frontend e, opcionalmente, o fluxo autenticado via `SMOKE_EMAIL`/`SMOKE_PASSWORD` sem imprimir tokens ou cookies.

**Ainda fora do código ou pendente de decisão:** confirmar no Render o deploy de `c9f02ac`/descendente e Flyway V12, cookies e dashboard autenticado; provedor real de e-mail para reset/verificação (SEC-001 funcional); política de retenção/exclusão de conta (SEC-005); anti-enumeração (SEC-006); revogação de access token/role (SEC-007); CSP com nonce; revisão jurídica LGPD; job Playwright no CI; e a refatoração global Fluxa → Opsire (P1.6).

---

## 10. Referências

### Repositório

- `backend/src/test/java/` - suíte existente.
- `backend/src/test/resources/application-test.properties` - H2, Flyway desativado e `ddl-auto=create-drop`.
- `backend/pom.xml` - dependências e configuração Maven.
- `frontend/package.json` - scripts e dependências do frontend.
- `.github/workflows/ci.yml` - gates atuais do CI.
- `docs/ROADMAP-FECHAMENTO-PENDENCIAS.md` - roadmap anterior; contém estado datado e precisa ser lido historicamente.
- `docs/ARCHITECTURE-DECISIONS.md` - regras financeiras, multi-conta, saldo e importação.

### Obsidian

- [[Projects/Fluxa]] - contexto e evidências recentes do projeto.
- [[Projects/Fluxa Backlog]] - testes de cenário anteriores e pendências.
- [[Tasks/Opsire - Plano de fechamento de produção, segurança e produto]] - regressões, riscos e E2E propostos.
- [[Tasks/Opsire - Importação bancária e saldo reconciliado]] - execução autenticada, importação, saldo, migrations e defeito `rememberCategoryRule`.
- [[Auditoria de Segurança Opsire/14 - Controles Aprovados]] - baseline de controles de segurança.
- [[Auditoria de Segurança Opsire/15 - Plano de Remediação e Testes de Regressão]] - catálogo histórico de regressão de segurança.

---

**Conclusão:** a Fase 1 aumentou a suíte de 78 para 99 testes e fechou contratos HTTP selecionados. A base atual ainda não demonstra, sozinha, a qualidade ponta a ponta do sistema. Os próximos ganhos são cobrir APIs restantes, validar migrations no PostgreSQL e automatizar fluxos completos do usuário no browser.
