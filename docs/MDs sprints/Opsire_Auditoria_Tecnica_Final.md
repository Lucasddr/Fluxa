# Opsire — Auditoria Técnica Final do Backend

> Consolidado de 3 rodadas de auditoria (`backend.zip`, `backend_1.zip`, revisão final de 29/09/2026).
> Cada item traz **o que é**, **por que importa** e **onde mexer**.
> Itens marcados ~~riscado~~ já foram corrigidos e ficam aqui só como histórico.

> ### ✅/🔴 Status após revisão de código (2026-10-16)
>
> **Resolvidos** (não precisam de ação): 1.1 CORS property · 1.2 env vars no compose · 1.3
> `CookieService` usa properties · 1.4 `DEFAULT 'USER'` (V2) · 1.5 handler de exceção · 2.1 NPE de
> categoria (`LEFT JOIN FETCH`) · 2.3 saldo dessincronizado (resolvido pela V3 + **ADR-001**) · 2.4
> FK de `refresh_tokens` · 2.5 500 mascarado como 400 · 2.6 `AccountNotFoundException` 204→404 ·
> 3.2 debug no `Dockerfile` · 4 (import morto, campo `kind`, `BOTH` no CHECK) · 5.1 N+1 · 5.2 índices
> (V6).
>
> **Ainda ABERTOS:**
> - **3.1 `X-Forwarded-For`** no `RateLimitFilter` — segue usando `getRemoteAddr()` (P2).
> - **3.3 senha do Postgres hardcoded** no `docker-compose.yml` (`ld0423`) — **continua** (P2).
> - **2.2 `AccountRepository` assume uma conta por usuário** — **continua** (`findByUserId` retorna
>   um único valor; `AccountController` vazio) (P0).
> - **4 código morto** — `AccountService.createCustomAccount`, `CreateAccountDTO` e
>   `CategoriesService.findCategories` seguem sem uso (P3).
> - **Novo (fora desta auditoria):** `CategoriesService.listCategories()` faz `PageRequest.of(0, 10)`
>   fixo (paginação quebrada); ~~status de parcela enum (`OVERDUE`) ≠ CHECK (`CANCELED`)~~ ✅ resolvido pela `V8__installment_overdue_status.sql` (2026-10-16).
>
> Roteiro atualizado: **`docs/ROADMAP-FECHAMENTO-PENDENCIAS.md`**.

---

## 1. Bloqueantes de boot/deploy

### 1.1 Mismatch de propriedade no CORS
`SecurityConfig` lê `@Value("${cors.allowed.origins}")` (plural), mas `application.properties`
define `cors.allowed.origin` (singular). Sem valor default, o Spring falha ao subir com
`PlaceholderResolutionException`.

**Por quê:** é um typo puro, mas derruba o boot inteiro — nenhum outro bug importa se a
aplicação não sobe.

**Onde:** `SecurityConfig.java` linha do `@Value`, ou `application.properties` — escolher um
nome e usar em ambos os lugares.

---

### 1.2 `docker-compose.yml` sem variáveis obrigatórias
`CORS_ALLOWED_ORIGINS`, `COOKIE_SECURE`, `COOKIE_SAME_SITE`, `COOKIE_ACCESS_PATH` e
`COOKIE_REFRESH_PATH` são lidas via `@Value` sem default em `CookieService`/`SecurityConfig`,
mas não aparecem no bloco `environment:` do compose.

**Por quê:** ambiente local (Docker Compose) quebra no start. Em produção (Railway) isso pode já
estar contornado se as env vars foram setadas direto no painel do Railway — **precisa confirmar**,
porque se não, produção também está quebrada.

**Onde:** `docker-compose.yml`, bloco `backend.environment`.

---

### 1.3 `CookieService` ignora a indireção das properties
`@Value("${COOKIE_ACCESS_PATH}")` e `@Value("${COOKIE_REFRESH_PATH}")` (maiúsculo, nome da env
var) em vez de `${cookie.access.path}`/`${cookie.refresh.path}`, que são as chaves com default
(`/` e `/auth`) no `application.properties`.

**Por quê:** o default fica morto — se a env var não estiver setada em qualquer ambiente, quebra,
mesmo havendo um valor de fallback pronto no properties.

**Onde:** `CookieService.java`.

---

### 1.4 `DEFAULT USER` sem aspas no schema
```sql
role VARCHAR(20) DEFAULT USER
```
No Postgres, `USER` sem aspas é *keyword* para `CURRENT_USER` — o usuário conectado no banco
(ex: `postgres`), não a string `"USER"`.

**Por quê:** se algum insert não setar `role` explicitamente (hoje todos setam, mas é uma
armadilha para o futuro), o valor vira o nome do usuário do banco, não a role correta.

**Onde:** nova migration Flyway (`V2__fix_role_default.sql`) — **nunca editar a V1 já aplicada**.
```sql
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'USER';
```

---

### 1.5 Handler de exceção mal declarado
```java
@ExceptionHandler(TransactionManagementException.class) // classe do Hibernate
public ResponseEntity<?> handleTransactionNotFoundException(TransactionNotFoundException ex)
```
As duas classes não têm relação de herança nenhuma.

**Por quê:** o Spring não consegue casar handler com exceção corretamente. Na prática, uma
transação não encontrada de verdade cai no handler genérico de `RuntimeException` e volta 400
em vez de 404.

**Onde:** `GlobalExceptionHandler.java` — trocar a annotation para
`@ExceptionHandler(TransactionNotFoundException.class)`.

---

## 2. Corretude / consistência de dados

### 2.1 NPE ao excluir categoria com transações (🆕 achado na revisão final)
`Transaction.category` é `@ManyToOne(optional = false)` / `nullable = false`, mas
`transactions.category_id` no banco permite `NULL` (`ON DELETE SET NULL`).
`listTransactions`/`listRecentTransactions` chamam `transaction.getCategory().getName()` sem
checar null.

**Por quê:** excluir uma categoria que tem transações associadas derruba a listagem de
transações e o dashboard com `NullPointerException` para qualquer transação órfã.

**Onde:** `TransactionService.java` — usar `Optional.ofNullable(transaction.getCategory())` com
um label default ("Sem categoria") na montagem do DTO. Alinhar também a anotação da entidade
(`optional = true`) para refletir a realidade do schema.

---

### 2.2 `AccountRepository` assume uma conta por usuário
`findAccountCurrentBalanceByUserId`/`updateAccountBalance` filtram só por `user.id`, sem
`account_id`. Existem `createCustomAccount` e `CreateAccountDTO` prontos, mas **sem endpoint**
que os exponha — por sorte isso evita o problema hoje.

**Por quê:** no dia em que uma segunda conta for criada, `getCurrentBalance` quebra
(`IncorrectResultSizeDataAccessException`, mais de uma linha retornada) e
`updateCurrentBalance` **sobrescreve o saldo de todas as contas do usuário ao mesmo tempo**,
silenciosamente — o segundo é o mais perigoso porque não lança erro nenhum.

**Onde:** `AccountRepository.java`/`AccountController.java` — decidir se o produto terá
multi-conta; se sim, todos os endpoints de account precisam de `accountId` explícito.

---

### 2.3 Saldo da conta não é sincronizado com as transações
`createTransaction`/`updateTransaction`/`deleteTransaction` nunca tocam em
`accounts.current_balance` — o saldo só muda via PATCH manual em `/account/amount`. Já existe
uma view no banco (`v_account_balance_from_transactions`) que calcula o saldo real a partir das
transações, mas nada no código a usa.

**Por quê:** é fácil o saldo mostrado ficar dessincronizado da realidade se o frontend esquecer
de chamar o PATCH depois de qualquer operação de transação. Duas fontes de verdade para o mesmo
dado é a receita clássica de bug de "saldo errado".

**Onde:** decisão de arquitetura — tratada com mais profundidade no Sprint 8 do roadmap (ver
arquivo de sprints). Resumo das opções: (a) calcular sempre a partir da view/query, sem coluna
armazenada; (b) manter a coluna, mas atualizá-la dentro da própria transação de
criar/editar/excluir transação, nunca via endpoint solto.

---

### 2.4 `refresh_tokens.user_id` sem FK
A tabela `refresh_tokens` não tem constraint de FK para `users`.

**Por quê:** ao deletar um usuário, os refresh tokens dele ficam órfãos no banco — não quebra
nada (não há FK pra violar), mas é lixo que acumula pra sempre.

**Onde:** nova migration adicionando
`ALTER TABLE refresh_tokens ADD CONSTRAINT ... FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;`

---

### 2.5 `GlobalExceptionHandler` mascara erros 500 como 400
O handler genérico de `RuntimeException` devolve **400 para qualquer coisa não mapeada**,
inclusive bugs de verdade (NullPointerException, etc.).

**Por quê:** dificulta debug e monitoramento em produção — um erro de servidor genuíno parece
"erro do cliente" nos logs/observabilidade.

**Onde:** `GlobalExceptionHandler.java` — separar: exceptions de negócio conhecidas → 4xx
específico; `Exception` genérica não mapeada → logar com stacktrace + devolver 500.

---

### 2.6 `AccountNotFoundException`: status inconsistente no corpo
```java
ResponseEntity.status(HttpStatus.NOT_FOUND) // 404 real
.body(new ErrorResponseDTO(HttpStatus.NO_CONTENT.value(), ...)) // 204 no JSON
```

**Onde:** `GlobalExceptionHandler.java` — trocar `NO_CONTENT` por `NOT_FOUND`.

---

## 3. Segurança operacional (deploy)

### 3.1 Rate limiter vulnerável a proxy/load balancer
`RateLimitFilter` usa `request.getRemoteAddr()`. Atrás de um proxy/load balancer (comum no
Railway), isso tende a devolver sempre o IP do proxy — o rate limit vira global em vez de
por usuário/IP real.

**Onde:** configurar `X-Forwarded-For` com lista de proxies confiáveis antes de considerar o
rate limit "pronto para produção".

### 3.2 Sobras de debug no `Dockerfile`
```dockerfile
RUN grep -n "flyway" pom.xml
RUN mvn dependency:tree -Dincludes=org.flywaydb:*
RUN jar tf target/*.jar | grep flyway
```
Não quebram nada, mas deixam o build mais lento e sujo. Remover.

### 3.3 Senha do Postgres hardcoded no `docker-compose.yml`
Baixo risco (ambiente local), mas é hábito ruim manter credencial em texto plano versionada.
Trocar por variável de ambiente mesmo em dev.

---

## 4. Código morto / limpeza (🆕 achados na revisão final)

| Item | Onde | Ação |
|---|---|---|
| Import solto e sem relação com o projeto (`org.apache.tomcat...OpenSSLCertificateVerifier`) | `Transaction.java` | Remover |
| Campo `kind` obrigatório em `CreateTransactionDTO`/`UpdateTransactionDTO`, nunca usado (serviço sempre deriva de `category.getKind()`) | DTOs de transação | Remover o campo do contrato da API (avisar o frontend) |
| `CategoriesService.toDTO()` monta `CategoryResponseDTO` com `icon`/`color` trocados — método (`findCategories`) não é chamado por nenhum controller hoje | `CategoriesService.java` | Corrigir a ordem ou remover o método morto |
| `AccountService.createCustomAccount` + `CreateAccountDTO` sem endpoint que os exponha | `AccountService.java` | Remover ou implementar o endpoint (ligado ao item 2.2) |
| CHECK constraint do banco aceita `'BOTH'` em `kind`, mas o enum Java só tem `INCOME`/`EXPENSE` | Migration + `CategoryKind.java` | Alinhar os dois lados (retirar `BOTH` do CHECK via nova migration, ou adicionar ao enum se for suportado no futuro) |

---

## 5. Otimização / performance

### 5.1 N+1 confirmado em listagem de transações (🆕)
`Category` é `FetchType.LAZY` e as queries de listagem (`findLastTransactions`) não usam
`JOIN FETCH`. Cada transação da página dispara um SELECT extra só pra buscar nome/cor da
categoria.

**Por quê funciona sem erro:** o Open-in-View do Spring está habilitado por padrão, então o
lazy-load acontece "escondido" durante a serialização da resposta — mas isso é 1 query extra
por linha da página, não 1 query pra página inteira.

**Correção:** `@Query("SELECT t FROM Transaction t LEFT JOIN FETCH t.category WHERE t.user.id = :userId ORDER BY t.occurredAt DESC")`
(o `LEFT JOIN` também resolve, de graça, o problema do item 2.1 — categoria nula não some da
lista).

### 5.2 Índices
A V1 já cobre os principais (`user_id`, FKs, datas de transação). Revisão adicional fica
condicionada a medir os padrões reais de consulta — não criar índice especulativo (ver Sprint 8
no roadmap).

---

## 6. O que já está resolvido (não precisa mexer de novo)

- Refresh token com rotação + hash SHA-256, verificação de revogação/expiração
- Rate limiting com Bucket4j em `/auth/login` e `/auth/register`
- Flyway com migration real (`V1__initial_schema.sql`)
- `ON DELETE CASCADE` no schema — resolveu o bug antigo de `deleteUser` quebrando por FK
- Sem mais `jwt.secret`/credenciais de banco hardcoded com fallback
- Endpoints de update para transação e categoria implementados, com ownership (`findByIdAndUserId`) consistente
- Validação de paginação (`PageableUtils`, limite de 100 por página) aplicada nos endpoints de listagem
- Ownership auditado contra a seção 1.2 do backlog de produto: create/update/delete de transação e categoria já validam posse do recurso corretamente
