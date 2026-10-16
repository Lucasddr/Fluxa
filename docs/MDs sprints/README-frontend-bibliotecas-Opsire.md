# Opsire — Plano de bibliotecas e filtros do frontend

> **Objetivo:** registrar as ideias para modernizar o frontend sem reinventar componentes e lógica que já existem em bibliotecas maduras.
>
> **Status:** planejamento — validar as versões e a integração com o projeto antes de implementar.

> ### Status real (2026-10-16)
>
> - **Radix UI** — ✅ **adotado** (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`) em
>   `AppDialog`, `CategoryModal`, `MenuListmodal`.
> - **TanStack Table** — ❌ **não adotado** (listas implementadas com grid/flex + estado local).
> - **TanStack Query** — ❌ **não adotado** (fetch em `services/*` + `useState`/`useEffect`).
> - **Filtros/paginação de transações** — hoje **client-side** sobre a página carregada; migrar
>   para o backend segue pendente (ver roadmap P1‑2). Este é o item mais concreto deste plano.

## Direção geral

Priorizar bibliotecas que resolvam comportamento e acessibilidade; personalizar a aparência para combinar com a identidade visual do Opsire.

- **Radix UI:** componentes acessíveis e sem estilo visual imposto, como dropdowns, menus, popovers e diálogos.
- **TanStack Table:** lógica de tabelas, filtros, ordenação e paginação.
- **TanStack Query:** busca, cache, estados de carregamento/erro e atualização dos dados vindos da API.
- **JavaScript/TypeScript nativo:** filtros simples sobre arrays que já estão carregados, usando `filter`, `sort` e `map`.

Não instalar tudo automaticamente: usar cada biblioteca quando ela resolver um problema concreto.

## Onde usar no Opsire

### 1. Tela de transações

**Candidata principal para TanStack Table**, caso a tela apresente as transações em formato de tabela ou lista tabular.

Possíveis funcionalidades:

- Busca por descrição.
- Filtrar por tipo: receita ou despesa.
- Filtrar por categoria.
- Filtrar por conta, quando houver suporte a múltiplas contas.
- Filtrar por período (data inicial e final).
- Ordenar por data, descrição ou valor.
- Paginação.
- Combinar filtros sem perder os filtros já selecionados.
- Estados de carregamento, erro e resultado vazio.

**Regra importante:** se a API devolver apenas uma página de transações, não aplicar um filtro local como se ele cobrisse todo o histórico. Nesse caso, enviar filtros e paginação para o backend Spring Boot, e usar o TanStack Table para controlar/representar o estado da tabela.

Fluxo desejado:

1. Usuário altera um filtro.
2. Frontend atualiza os parâmetros de consulta.
3. API retorna os resultados correspondentes e a paginação.
4. Interface mostra carregamento, erro ou resultados.

Definir os nomes dos parâmetros conforme o contrato real da API; não presumir que já existem endpoints ou parâmetros para todos os filtros.

### 2. Tela de categorias

TanStack Table pode ser útil se as categorias forem apresentadas em tabela e precisarem de ordenação ou filtros. Se a tela for apenas uma lista simples, componentes Radix e filtros nativos podem ser suficientes.

Possíveis funcionalidades:

- Busca por nome da categoria.
- Filtrar por tipo: receita ou despesa.
- Ordenar alfabeticamente.
- Separar visualmente categorias de receita e despesa.
- Exibir estados vazios e mensagens quando não houver correspondências.

Respeitar as regras de domínio do backend: a interface não deve ser a fonte de verdade para validar o tipo da categoria ou a associação dela com uma transação.

### 3. Dashboard, relatórios e insights

- Usar filtros nativos quando os dados já carregados forem pequenos e completos.
- Para intervalos de datas e consultas sobre um histórico grande, preferir parâmetros no backend.
- Considerar TanStack Query para cache e atualização dos dados da API, caso a estratégia atual de chamadas justifique a adoção.
- Manter os filtros de período consistentes entre os componentes que precisam compartilhar o mesmo intervalo.

### 4. Modais, menus e filtros visuais

Usar Radix UI para a interação e construir o visual com os estilos do Opsire:

- Dropdowns de ações.
- Menus de seleção.
- Popovers para filtros mais compactos.
- Dialogs para criar/editar registros e confirmar ações.
- Componentes acessíveis por teclado, com foco e estados apropriados.

Verificar a responsividade em telas pequenas, especialmente em diálogos e popovers. A biblioteca fornece comportamento; o layout final ainda precisa ser validado no projeto.

## Papel de cada ferramenta

| Ferramenta | Responsabilidade | Não é responsável por |
|---|---|---|
| Radix UI | Comportamento e acessibilidade de componentes de interface | Regras de negócio ou acesso à API |
| TanStack Table | Estado e lógica de tabela, filtros, ordenação e paginação | Buscar dados da API automaticamente ou definir regras do backend |
| TanStack Query | Buscar/cachear dados assíncronos e controlar estados da consulta | Criar a interface visual de filtros ou substituir a API |
| JavaScript/TypeScript nativo | Transformações simples em dados já disponíveis | Consultar registros que não foram carregados no frontend |
| Backend Spring Boot | Fonte de verdade, validação e filtros/paginação de dados do servidor | Estilização da interface |

## Plano de implementação sugerido

### Etapa 1 — Inventariar a tela atual

- [ ] Identificar como as transações e categorias são carregadas.
- [ ] Conferir os endpoints, DTOs e parâmetros existentes no backend.
- [ ] Verificar se a lista atual é completa ou paginada.
- [ ] Anotar filtros e ações que já funcionam.
- [ ] Evitar duplicar lógica de negócio no frontend.

### Etapa 2 — Criar padrões reutilizáveis

- [ ] Definir componentes visuais de busca, seleção de filtro, botão, menu e diálogo.
- [ ] Padronizar espaçamento, tipografia, cores, bordas e estados de foco.
- [ ] Validar acessibilidade por teclado.
- [ ] Testar os componentes em desktop e mobile.

### Etapa 3 — Implementar primeiro em transações

- [ ] Busca por descrição.
- [ ] Filtro de receita/despesa.
- [ ] Filtro de categoria.
- [ ] Filtro por intervalo de datas.
- [ ] Ordenação e paginação.
- [ ] Sincronização com parâmetros do backend, quando aplicável.
- [ ] Estados de loading, erro e nenhum resultado.
- [ ] Testar combinações de filtros e limpar filtros.

### Etapa 4 — Aplicar o padrão em categorias

- [ ] Busca por nome.
- [ ] Filtro por tipo.
- [ ] Ordenação, se trouxer benefício real.
- [ ] Manter o comportamento consistente com a tela de transações.

### Etapa 5 — Avaliar TanStack Query

- [ ] Verificar a estratégia atual de `fetch` e atualização dos dados.
- [ ] Avaliar se cache, invalidação e revalidação reduziriam chamadas duplicadas ou dados desatualizados.
- [ ] Migrar gradualmente, sem reescrever todas as chamadas de uma vez.
- [ ] Definir como atualizar/inutilizar o cache após criar, editar ou excluir registros.

### Etapa 6 — Validar antes de concluir

- [ ] `npm run build` passa.
- [ ] Filtros combinados produzem os resultados esperados.
- [ ] Paginação e filtros são consistentes entre si.
- [ ] Criar/editar/excluir continuam funcionando.
- [ ] Loading, erro e resultado vazio são tratados.
- [ ] Modais e filtros funcionam em viewport móvel.
- [ ] O frontend não é tratado como fonte de verdade para validações de negócio.

## Decisões em aberto

- [ ] Confirmar se a tela de transações deve usar tabela, lista ou layouts diferentes em desktop/mobile.
- [ ] Confirmar se o backend já oferece filtros e paginação para todos os campos necessários.
- [ ] Decidir se TanStack Query será adotado ou se a solução atual de requisições é suficiente.
- [ ] Verificar versões instaladas e compatibilidade antes de adicionar novas dependências.
- [ ] Não usar `npm audit fix --force` apenas para zerar alertas: avaliar a árvore de dependências e o impacto de cada atualização.

## Links úteis

- [Radix UI](https://www.radix-ui.com/primitives)
- [TanStack Table](https://tanstack.com/table/latest/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Next.js](https://nextjs.org/docs)

---

**Princípio do projeto:** reutilizar comportamento confiável, personalizar a interface para a identidade do Opsire e manter regras de negócio e integridade dos dados no backend.
