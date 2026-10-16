# Opsire — Backlog Integrado Backend + Frontend

> **Objetivo deste documento:** consolidar o backlog técnico e de produto do Opsire em um único plano para que Backend e Frontend sejam executados de forma coordenada.
>
> **Contexto:** este backlog incorpora as pendências identificadas nas conversas de **27 e 28/09/2026**, além do estado atual do sistema em produção.
>
> **Regra principal:** não tratar Backend e Frontend como dois backlogs independentes. Toda funcionalidade deve ser acompanhada ponta a ponta: contrato da API → regra de negócio → segurança → implementação frontend → estados de UI → testes → produção.

---

> ### ✅ Status real dos checkboxes (revisão de código em 2026-10-16)
>
> Vários `[ ]` abaixo já foram implementados. Correspondência verificada:
> - **4.1 / 4.2 / 4.3 / 4.4 / 4.5** — ✅ feitos (CRUD frontend de transação, anti-duplo-submit,
>   idempotência no backend, interceptor 401 com lock + retry + auto-logout).
> - **5.1 / 5.2 / 5.4 / 5.5** — ✅ feitos (seletor de período, propagação de `start`/`end`,
>   loading/empty/error, validação de datas no backend).
> - **6.1** — ✅ exceto **Contas** (❌ não existe). **6.2/6.3/6.4** — ✅ feitos (API layer centralizada).
> - **7.1 / 7.2 / 7.3 / 7.4 / 7.5** — ✅ **feitos** (os `[ ]` de forgot/reset/verify abaixo estão
>   **desatualizados**: existem `PasswordResetService`, `EmailVerificationService`, telas
>   `/forgot-password`, `/reset-password`, `/verify-email` e testes).
> - **8.1 / 8.2 / 8.3 / 8.4** — ✅ feitos (ADR-001, V6, LEFT JOIN FETCH, medição). **8.5** — não
>   implementado (correto: condicional a medição; medição não comprovou necessidade).
> - **9.1 / 9.2** — ✅ feitos. **9.3 / 9.4** — ❌ adiados (identidade visual/design system).
> - **10.1–10.6** — ✅ feitos (CORS, cookies, rate limit expandido, validação, ErrorResponseDTO).
>   **10.7 LGPD** — 🟡 minuta pronta (`docs/LGPD-*.md`, rotas `/privacy`, `/terms`), texto jurídico
>   pendente. **10.8 CI/CD** — ✅ pipeline de validação (`ci.yml`).
>
> **Fora deste backlog** (achado na revisão): **Compras no crédito + Parcelas** (diferencial do
> produto, entidades existem sem CRUD/UI), **Módulo de Contas/multi-conta**, paginação de
> categorias e página de Insights. Ver **`docs/ROADMAP-FECHAMENTO-PENDENCIAS.md`**.

---

## 0. Estado atual do projeto

### Stack

#### Backend
- Spring Boot 4.0.3
- Java 17
- Maven Wrapper
- PostgreSQL
- Flyway 11.14.1
- Spring Security
- JWT
- Refresh token opaco armazenado por hash
- Argon2PasswordEncoder
- Docker
- Railway
- Supabase PostgreSQL em produção

#### Frontend
- Next.js 16.1.6
- App Router
- TypeScript
- Tailwind
- Recharts
- lucide
- Vercel

#### Infraestrutura
- Backend em Railway
- Frontend em Vercel
- Banco de produção no Supabase
- Docker/Compose para ambiente local
- Nginx utilizado no ambiente local/proxy
- CORS configurável por variável de ambiente
- Cookies de autenticação HttpOnly

---

# 1. Princípios arquiteturais

Estas regras devem ser preservadas durante a execução do backlog.

## 1.1 Backend é a autoridade sobre regras de negócio

O Frontend:
- coleta dados;
- apresenta dados;
- controla estado visual;
- faz chamadas HTTP;
- fornece feedback ao usuário.

O Backend:
- valida regras de negócio;
- determina o usuário autenticado;
- valida ownership;
- valida relações entre entidades;
- controla transições de estado;
- calcula valores de domínio.

Nunca confiar em `userId` enviado pelo frontend para determinar o dono de um recurso.

O usuário deve ser obtido da autenticação/sessão.

---

## 1.2 Ownership deve ser validado explicitamente

FK garante que uma entidade relacionada existe.

FK **não garante que ela pertence ao usuário autenticado**.

Exemplo:

```text
transaction
 ├── user_id
 ├── account_id
 └── category_id
```

Ao criar/editar uma transação:

1. identificar usuário autenticado;
2. buscar conta;
3. verificar que a conta pertence ao usuário;
4. buscar categoria;
5. verificar que a categoria pertence ao usuário;
6. validar `CategoryKind`;
7. executar operação.

Isso deve existir em create, update, delete e consultas relevantes.

---

## 1.3 UUIDs continuam como PKs simples

As entidades utilizam UUIDs únicos.

Não criar chaves primárias compostas sem necessidade real de domínio.

Relacionamentos continuam sendo feitos por FKs normais.

---

## 1.4 Frontend não deve duplicar regra de negócio

Validações simples de UX podem existir no frontend para feedback rápido.

Porém:

```text
Frontend validation != security/business authority
```

O Backend deve sempre validar novamente.

---

# 2. Objetivo das próximas sprints

A prioridade é:

```text
1. Fechar fluxos existentes
2. Corrigir confiabilidade
3. Integrar Front + Back
4. Tornar dashboard funcional
5. Melhorar mobile/UX
6. Testar autenticação e domínio
7. Medir performance
8. Refatorar arquitetura
9. Segurança/legal/produção
10. Monetização/SaaS
```

Não antecipar Redis, agregações ou otimizações complexas antes de medir o comportamento real.

---

# SPRINT 4 — Fechamento do fluxo de transações + sessão

## Objetivo

O usuário deve conseguir executar o ciclo completo:

```text
Criar
 ↓
Visualizar
 ↓
Detalhar
 ↓
Editar
 ↓
Excluir
```

E a sessão deve sobreviver corretamente à expiração do access token.

---

## 4.1 FRONTEND — Transações

### [x] Implementar edição de transação

Criar fluxo completo:

```text
Lista
 ↓
Abrir detalhes/ação
 ↓
Editar
 ↓
Preencher formulário
 ↓
PATCH/PUT
 ↓
Atualizar UI
```

Requisitos:

- reutilizar validações de formulário existentes quando possível;
- carregar dados atuais;
- permitir alteração de:
  - valor;
  - descrição;
  - data;
  - categoria;
  - conta;
  - tipo, somente se o domínio permitir;
- impedir alteração incompatível com as regras do backend;
- mostrar loading;
- impedir submit duplicado;
- tratar `401`;
- tratar erros de validação;
- atualizar dashboard/lista após sucesso.

---

### [x] Implementar detalhes da transação

Criar visualização contendo pelo menos:

- descrição;
- valor;
- tipo;
- categoria;
- conta;
- data;
- informações relevantes de parcelamento, quando aplicável.

A tela/modal deve possuir ações apropriadas:

```text
Editar
Excluir
Fechar/Voltar
```

---

### [x] Implementar exclusão

Fluxo:

```text
Usuário clica em excluir
 ↓
Confirmação
 ↓
DELETE
 ↓
Atualização da lista/dashboard
```

Requisitos:

- confirmação explícita;
- loading durante operação;
- impedir duplo clique;
- tratar `401`;
- tratar `404`;
- tratar `403`;
- tratar erros inesperados;
- remover item da UI após sucesso ou recarregar fonte de verdade.

---

## 4.2 FRONTEND — Prevenir double-submit

Foi identificado um caso real em que uma operação lenta permitiu criação de múltiplas transações.

### [x] Desabilitar submit imediatamente

Ao iniciar a requisição:

```text
isSubmitting = true
```

Enquanto estiver true:

- botão desabilitado;
- formulário não pode disparar outro submit;
- mostrar feedback visual.

Ao terminar:

```text
finally:
    isSubmitting = false
```

---

### [x] Evitar chamadas concorrentes

Não depender somente de debounce visual.

O handler deve impedir:

```text
POST
POST
POST
```

para o mesmo formulário antes da primeira resposta.

---

## 4.3 BACKEND — Proteção contra duplicação

### [x] Revisar proteção de criação

A proteção do backend não deve ser baseada somente em rate limit de minutos.

Avaliar uma janela curta adequada para operações de criação.

Objetivo:

```text
request duplicada causada por clique/latência
        ↓
não gerar múltiplas transações acidentais
```

Importante:

Rate limit é uma camada de proteção.

Não deve ser utilizado como substituto de uma regra de idempotência quando idempotência fizer sentido.

---

## 4.4 BACKEND — Update/Delete

### [x] Revisar endpoint de update

Garantir:

- autenticação;
- ownership;
- validação do DTO;
- validação de conta;
- validação de categoria;
- compatibilidade de `CategoryKind`;
- consistência com parcelas/compromissos quando aplicável;
- resposta HTTP consistente.

---

### [x] Revisar endpoint de delete

Garantir:

- autenticação;
- ownership;
- comportamento consistente quando recurso não existe;
- limpeza/atualização correta de relações dependentes;
- resposta HTTP consistente.

---

# 4.5 Sessão — Refresh automático

## Problema atual

O backend possui refresh token funcionando, mas o frontend ainda precisa tratar automaticamente um `401`.

### [x] Criar mecanismo centralizado de refresh

Fluxo esperado:

```text
Request original
      ↓
      401
      ↓
Refresh
      ↓
Refresh OK?
  ├── SIM → repetir request original UMA VEZ
  └── NÃO → logout/redirecionamento
```

---

## Regra crítica

Uma requisição só pode disparar **um ciclo de refresh**.

Nunca:

```text
401
 ↓
refresh
 ↓
401
 ↓
refresh
 ↓
401
 ↓
...
```

---

## [x] Evitar múltiplos refresh simultâneos

Se várias requests receberem `401` simultaneamente:

```text
Request A → 401
Request B → 401
Request C → 401
```

Não fazer:

```text
refresh A
refresh B
refresh C
```

Idealmente:

```text
Request A ─┐
Request B ─┼→ mesmo refresh em andamento
Request C ─┘
             ↓
          resultado
             ↓
        retry requests
```

Implementar uma única promessa/lock de refresh no cliente.

---

## [x] Não interceptar o próprio refresh como request comum

O endpoint:

```text
/auth/refresh
```

deve possuir tratamento especial.

Se o refresh falhar, não tentar refresh novamente.

---

## [x] Logout em falha definitiva

Se:

- refresh token expirou;
- refresh token foi revogado;
- refresh retornou erro;
- sessão não é mais válida;

então:

```text
limpar estado local de autenticação
↓
redirecionar para login
```

---

# SPRINT 5 — Dashboard funcional

## Objetivo

Remover o intervalo hardcoded e fazer todos os dados da dashboard responderem ao período escolhido.

---

## 5.1 FRONTEND — Seletor de período

### [x] Criar seletor

Opções iniciais:

- 7 dias
- 15 dias
- 30 dias
- 3 meses
- 6 meses

---

## [x] Estado central do período

Evitar cada componente controlar seu próprio intervalo.

Exemplo conceitual:

```text
Dashboard
 └── selectedPeriod
      ├── buildDashboard
      ├── recentTransactions
      └── insightCards
```

---

## 5.2 API

Os seguintes endpoints precisam receber o intervalo selecionado:

```text
/dashboard/buildDashboard
/dashboard/recentTransactions
/dashboard/insightCards
```

Atualmente o intervalo da dashboard está hardcoded e deve ser removido.

---

## 5.3 Consistência temporal

Todas as informações exibidas na mesma dashboard devem utilizar o mesmo período.

Evitar:

```text
gráfico → 30 dias
recentes → 7 dias
insights → 15 dias
```

sem uma justificativa explícita de produto.

---

## 5.4 Estados de UI

### [x] Loading

Durante troca de período:

- mostrar loading/skeleton;
- evitar conteúdo antigo parecer atual;
- evitar múltiplas requests desnecessárias.

### [x] Empty state

Exemplo:

```text
Não há movimentações neste período.
```

### [x] Error state

Mostrar mensagem amigável e permitir retry.

---

## 5.5 BACKEND — Dashboard

### [x] Revisar contratos dos endpoints

Garantir que:

- `start`;
- `end`;

sejam validados.

Definir claramente:

- timezone;
- inclusão/exclusão das datas;
- comportamento quando `start > end`;
- limite máximo de intervalo, se necessário.

---

## [x] Testar dashboard com:

- 7 dias;
- 15 dias;
- 30 dias;
- 3 meses;
- 6 meses;
- nenhum dado;
- um único dado;
- grande volume de transações.

---

# SPRINT 6 — Mobile + refatoração do frontend

## Objetivo

Fazer o produto deixar de parecer otimizado apenas para desktop.

---

## 6.1 Telas prioritárias

### [x] Login
### [x] Cadastro
### [x] Dashboard
### [x] Transações
### [x] Criação de transação
### [x] Edição de transação
### [x] Detalhes
### [x] Categorias
### [ ] Contas

---

## 6.2 Modal de transação

Garantir:

- largura adequada;
- inputs utilizáveis;
- teclado mobile;
- scroll;
- botões acessíveis;
- feedback de loading;
- mensagens de erro;
- prevenção de submit duplicado.

---

## 6.3 Componentização

Identificar componentes/páginas grandes e separar em:

```text
components/
hooks/
services/
types/
utils/
```

Evitar colocar:

- regra de negócio;
- chamadas API;
- layout;
- estado;
- validação;

todos no mesmo componente.

---

## 6.4 API layer

Centralizar chamadas HTTP.

Exemplo conceitual:

```text
services/
 ├── auth
 ├── transactions
 ├── categories
 ├── accounts
 └── dashboard
```

Isso facilita:

- refresh token;
- tratamento de erro;
- tipagem;
- manutenção.

---

# SPRINT 7 — Autenticação completa + testes

## Objetivo

Fechar o ciclo de segurança da conta.

---

# 7.1 Backend — Auth

### [x] Testes do AuthService

Cobrir:

- cadastro;
- login;
- senha inválida;
- usuário inexistente;
- refresh válido;
- refresh expirado;
- refresh revogado;
- rotação;
- logout/revogação;
- credenciais inválidas.

---

## 7.2 Frontend

### [x] Fluxo de login

### [x] Fluxo de logout

### [x] Fluxo de refresh

### [x] Redirecionamento para login

### [x] Estado de sessão

Evitar estado de autenticação inconsistente entre páginas.

---

# 7.3 Forgot Password

### Backend

- [ ] endpoint solicitar recuperação;
- [ ] token seguro;
- [ ] expiração;
- [ ] armazenamento seguro do token;
- [ ] invalidação após uso;
- [ ] alteração de senha.

### Frontend

- [ ] formulário de solicitação;
- [ ] formulário de nova senha;
- [ ] estados de sucesso/erro;
- [ ] tratamento de token inválido/expirado.

---

# 7.4 Verificação de e-mail

### Backend

- [ ] geração do token;
- [ ] expiração;
- [ ] confirmação;
- [ ] invalidação após uso.

### Frontend

- [ ] tela/estado de verificação;
- [ ] reenvio;
- [ ] feedback.

---

# 7.5 Logs

Revisar logs atuais.

Objetivo:

```text
INFO → eventos relevantes de aplicação
DEBUG → detalhes técnicos
WARN → situações anormais
ERROR → falhas
```

Nunca logar:

- senha;
- refresh token;
- JWT completo;
- dados sensíveis desnecessários.

---

# SPRINT 8 — Banco, domínio e performance

## Objetivo

Melhorar o modelo sem otimização prematura.

---

# 8.1 Account

Existe atualmente:

```text
start_balance
current_balance
currency
```

A direção desejada é reduzir a dependência de saldo armazenado.

### [x] Definir fonte oficial do saldo

O sistema deve ter uma regra única para calcular o saldo.

A lógica conceitual atual é:

```text
saldo disponível =
receitas
- saídas
- compromissos futuros
```

Documentar exatamente como:

- transações;
- compras no crédito;
- parcelas;

participam do cálculo.

---

# 8.2 Índices

### [x] Revisar índices do PostgreSQL

Avaliar principalmente:

- `user_id`;
- FKs;
- datas de transação;
- campos utilizados em filtros;
- combinações utilizadas frequentemente em consultas.

Não criar índice simplesmente porque uma coluna existe.

Basear nos padrões reais de consulta.

---

# 8.3 N+1

### [x] Investigar queries do Hibernate

Verificar:

- relações carregadas individualmente;
- loops que geram queries;
- dashboard;
- categorias;
- contas;
- transações.

---

# 8.4 Dashboard — medir antes de otimizar

Registrar:

- quantidade de queries;
- tempo;
- volume de dados;
- endpoints chamados;
- consultas repetidas.

Somente depois decidir entre:

```text
índices
↓
query optimization
↓
projeções/DTO queries
↓
agregação
↓
cache/Redis
```

Não assumir que Redis é necessário.

---

# 8.5 Agregações

Se a medição demonstrar necessidade:

### Opção A — agregação diária

Exemplo:

```text
daily_financial_aggregate
```

Por usuário/conta/data.

### Atualizar em:

```text
transaction create
transaction update
transaction delete
```

### [ ] Criar migration

Exemplo:

```text
V2__...
```

Se forem necessárias correções:

```text
V3__...
```

Nunca editar migration já aplicada em produção.

---

# SPRINT 9 — UX + identidade visual Opsire

## Objetivo

Transformar a interface de "sistema funcional" em produto.

---

## 9.1 Feedback

### [x] Loading states
### [x] Skeletons quando fizer sentido
### [x] Toast de sucesso
### [x] Toast/feedback de erro
### [x] Empty states
### [x] Confirmações destrutivas

---

## 9.2 Erros

Transformar respostas técnicas como:

```text
401
403
404
409
500
```

em mensagens adequadas ao usuário.

O frontend não deve exibir stack trace ou mensagem interna do backend.

---

## 9.3 Identidade

Consolidar:

```text
Opsire
```

Direção visual:

- mais escuro;
- cinza/preto;
- menos dependência do azul antigo;
- visual limpo;
- financeiro sem aparência excessivamente "banco tradicional".

---

## 9.4 Sistema visual

Padronizar:

- botões;
- inputs;
- cards;
- modais;
- tabelas;
- badges;
- espaçamento;
- tipografia;
- ícones;
- estados de foco;
- estados disabled;
- estados de erro.

Criar componentes reutilizáveis quando houver repetição real.

---

# SPRINT 10 — Segurança + produção

## Objetivo

Preparar o sistema para usuários reais.

---

# 10.1 CORS

### [x] Revisar origens

Usar configuração por ambiente.

Nunca deixar:

```text
*
```

quando credentials/cookies estiverem envolvidos.

---

# 10.2 Cookies

Validar em produção:

```text
HttpOnly
Secure
SameSite
Path
```

Variáveis relacionadas devem continuar configuráveis por ambiente.

---

# 10.3 Rate limiting

Já existe proteção em:

```text
/auth/login
/auth/register
```

Revisar também endpoints sensíveis.

Avaliar proteção específica para:

- criação de transações;
- recuperação de senha;
- reenvio de e-mail;
- verificação de e-mail.

---

# 10.4 Autorização

Para cada endpoint protegido, verificar:

```text
authenticated?
        ↓
resource exists?
        ↓
resource belongs to current user?
        ↓
operation allowed?
```

---

# 10.5 Validação

Revisar:

- tamanho máximo;
- valores negativos;
- datas;
- enums;
- UUID inválido;
- paginação;
- limites de page size;
- payload excessivo.

Manter limite de paginação existente.

---

# 10.6 Erros

Padronizar:

```text
ErrorResponseDTO
{
    status,
    errors[]
}
```

Evitar respostas inconsistentes entre controllers.

---

# 10.7 LGPD / Legal

### [ ] Política de privacidade
### [ ] Termos de uso
### [ ] Informações de tratamento de dados
### [ ] Fluxos de consentimento quando aplicáveis
### [ ] Banner/cookie handling conforme necessidade

Não implementar um cookie popup apenas por estética; definir primeiro quais cookies/tecnologias realmente exigem comunicação/consentimento.

---

# 10.8 CI/CD

Criar pipeline que execute pelo menos:

```text
push
 ↓
build
 ↓
tests
 ↓
quality checks
 ↓
deploy
```

Backend:

```text
mvn test
mvn package
```

Frontend:

```text
lint
build
tests, quando disponíveis
```

Não permitir deploy automático quebrado.

---

# SPRINT 11 — SaaS / produto comercial

## Objetivo

Preparar o Opsire para usuários além do desenvolvedor.

---

# 11.1 Free tier

Definir:

- recursos gratuitos;
- limites;
- quantidade de dados;
- funcionalidades básicas.

O básico deve continuar utilizável.

---

# 11.2 Plano pago

Possíveis recursos já considerados:

- automações;
- Open Finance;
- importações;
- recursos avançados;
- conforto/automação.

Não implementar tudo de uma vez.

Primeiro definir quais recursos realmente possuem valor comercial.

---

# 11.3 Landing page

Criar:

- proposta de valor;
- explicação do produto;
- screenshots;
- benefícios;
- pricing;
- FAQ;
- CTA;
- privacidade;
- termos.

---

# 11.4 Onboarding

Fluxo inicial:

```text
Cadastro
 ↓
Configuração inicial
 ↓
Conta principal
 ↓
Categorias
 ↓
Primeira transação
 ↓
Dashboard
```

O onboarding deve reduzir o tempo até o primeiro valor percebido.

---

# 12. Backlog técnico transversal

Itens que devem acompanhar as sprints.

## Backend

- [ ] Testes unitários dos services críticos
- [ ] Testes de integração dos endpoints críticos
- [ ] Revisão de DTOs
- [ ] Revisão de exceptions
- [ ] Padronização de responses
- [ ] Revisão de logs
- [ ] Revisão de ownership
- [ ] Revisão de validações
- [ ] Revisão de queries
- [ ] Revisão de migrations
- [ ] Documentação das variáveis de ambiente

---

## Frontend

- [ ] API layer centralizada
- [ ] Tratamento global de `401`
- [ ] Refresh com retry único
- [ ] Estado global de autenticação
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Toasts
- [ ] Componentização
- [ ] Responsividade
- [ ] Tipagem dos responses
- [ ] Remover regras de negócio duplicadas
- [ ] Padronizar formulários

---

# 13. Testes ponta a ponta prioritários

Antes de considerar o sistema "pronto", validar manualmente e/ou automaticamente:

## Fluxo 1 — Cadastro

```text
Cadastro
 ↓
Login
 ↓
Dashboard
```

---

## Fluxo 2 — Transação

```text
Login
 ↓
Criar transação
 ↓
Ver na lista
 ↓
Abrir detalhes
 ↓
Editar
 ↓
Ver alteração
 ↓
Excluir
 ↓
Confirmar remoção
```

---

## Fluxo 3 — Sessão expirada

```text
Usuário autenticado
 ↓
Access token expira
 ↓
Request protegida
 ↓
401
 ↓
Refresh
 ↓
Retry
 ↓
Request funciona
```

---

## Fluxo 4 — Refresh inválido

```text
Request
 ↓
401
 ↓
Refresh
 ↓
falha
 ↓
logout
 ↓
login
```

---

## Fluxo 5 — Concorrência

```text
Clique rápido múltiplas vezes
 ↓
Frontend bloqueia duplicação
 ↓
Backend continua protegido
 ↓
uma operação válida
```

---

## Fluxo 6 — Ownership

Testar:

```text
Usuário A
 ↓
tenta acessar recurso do Usuário B
```

Resultado esperado:

```text
acesso negado
```

Não confiar apenas no ID enviado pelo cliente.

---

# 14. Critérios de Definition of Done

Uma tarefa não está concluída apenas porque o código foi escrito.

Considerar concluída quando:

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
- [ ] Código commitado
- [ ] Build funcionando
- [ ] Deploy funcionando quando a tarefa for de produção

---

# 15. Estratégia de execução

## Regra

Não fazer:

```text
20 tarefas de backend
+
20 tarefas de frontend
+
depois tentar integrar
```

Fazer por fluxo.

### Exemplo:

```text
TRANSAÇÃO — EDITAR

Backend
 ↓
DTO
 ↓
Service
 ↓
Controller
 ↓
teste
 ↓
Frontend service
 ↓
form
 ↓
UI
 ↓
loading/error
 ↓
integração
 ↓
teste ponta a ponta
```

Depois partir para a próxima funcionalidade.

---

# 16. Ordem operacional recomendada

## Sprint 4
### Transações + Refresh

Prioridade máxima.

Resultado:

> O núcleo operacional do Opsire funciona de ponta a ponta.

---

## Sprint 5
### Dashboard

Resultado:

> O usuário consegue analisar seus dados pelo período escolhido.

---

## Sprint 6
### Mobile + Frontend

Resultado:

> O sistema é utilizável fora do desktop e o código do front fica sustentável.

---

## Sprint 7
### Auth + testes

Resultado:

> Sessão, recuperação de conta e segurança têm cobertura adequada.

---

## Sprint 8
### Banco + performance

Resultado:

> O sistema está preparado para crescer sem otimização especulativa.

---

## Sprint 9
### UX + identidade

Resultado:

> Opsire passa a parecer um produto finalizado.

---

## Sprint 10
### Segurança + produção

Resultado:

> Base técnica preparada para usuários reais.

---

## Sprint 11
### SaaS

Resultado:

> Começar a transformar Opsire em produto comercial.

---

# 17. Regra para o Claude

Ao trabalhar neste backlog:

1. **Não reescrever arquitetura sem necessidade.**
2. **Não criar abstrações apenas por antecipação.**
3. **Não adicionar Redis/agregações antes de medir.**
4. **Não mover regra de negócio para o frontend.**
5. **Não confiar em IDs de usuário enviados pelo frontend.**
6. **Não alterar migrations já aplicadas em produção.**
7. **Não implementar frontend sem verificar o contrato real da API.**
8. **Não implementar backend sem considerar como o frontend consumirá a funcionalidade.**
9. **Ao alterar API/DTO, procurar imediatamente os consumidores frontend.**
10. **Ao alterar domínio/backend, verificar impactos em dashboard, transações e autenticação.**
11. **Priorizar correção de fluxos existentes antes de novas features.**
12. **Manter commits pequenos e semanticamente relacionados.**

---

# 18. Primeiro ciclo de execução

Começar pelo seguinte conjunto:

### Bloco A — Transações

- [ ] Edit transaction backend
- [ ] Edit transaction frontend
- [ ] Transaction details frontend
- [ ] Delete transaction frontend
- [ ] Delete transaction backend review
- [ ] Double-submit frontend protection
- [ ] Backend short-window protection/idempotency review

### Bloco B — Sessão

- [ ] Centralizar API client
- [ ] Interceptar 401
- [ ] Refresh único
- [ ] Retry único
- [ ] Concorrência de refresh
- [ ] Logout após refresh failure

### Bloco C — Dashboard

- [ ] Period selector
- [ ] Remover hardcoded interval
- [ ] Propagar start/end para todos os endpoints
- [ ] Loading/error/empty states
- [ ] Validar datas no backend

Somente depois disso avançar para mobile/refatoração estrutural.

---

# 19. Resultado esperado

Ao final deste roadmap, o Opsire deve evoluir de:

```text
"Sistema financeiro pessoal funcionando em produção"
```

para:

```text
"Produto SaaS financeiro com fluxo completo,
sessão confiável, frontend responsivo,
backend protegido, domínio consistente,
observabilidade/testes e base preparada para monetização."
```

O objetivo não é adicionar complexidade por adicionar.

O objetivo é fazer cada camada cumprir claramente seu papel:

```text
                 ┌─────────────────────┐
                 │       Usuário       │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │      Frontend       │
                 │ UI / Estado / HTTP  │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │       API REST      │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │      Backend        │
                 │ Regras / Segurança  │
                 │ Domínio / Serviços  │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │     PostgreSQL      │
                 └─────────────────────┘
```

**Prioridade atual: fechar o produto que já existe antes de aumentar o produto.**
