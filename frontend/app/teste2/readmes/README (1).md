# categorias/page.tsx

Tela de listagem e gerenciamento de categorias financeiras.

---

## Visão geral

Essa página é um Client Component (`"use client"`) porque depende de estado local (filtros, paginação, modal aberto). Ela não faz nenhuma chamada de API — tudo parte do array `MOCK_CATEGORIES` declarado no próprio arquivo.

---

## Tipos

```ts
type Category = {
  id: string;
  name: string;        // "Alimentação"
  subtitle: string;    // linha menor embaixo do nome na tabela
  type: "Despesa" | "Receita";
  account: string;     // "Conta Principal"
  description: string; // texto da coluna Descrição
  status: "Ativa" | "Inativa";
  icon: string;        // chave do ICON_MAP, ex: "ShoppingCart"
  color: string;       // hex, ex: "#3B82F6"
};
```

O campo `icon` é uma **string**, não o componente em si. Isso é intencional: quando vier da API, o backend vai devolver uma string. O componente `CategoryIcon` resolve isso em runtime via `ICON_MAP`.

---

## ICON_MAP

```ts
const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingCart, Home, Car, Heart, ...
};
```

Dicionário que mapeia nome-string → componente Lucide. Serve como camada de indireção entre o dado (string) e o JSX (componente). Se o ícone não existir no mapa, cai no fallback `ShoppingCart` (`?? ShoppingCart`).

**Atenção:** se você adicionar novos ícones no `CategoryModal`, precisa incluí-los aqui também, senão a tabela vai mostrar o fallback.

---

## Componentes internos

São funções declaradas fora do componente principal para não serem recriadas a cada render.

### `CategoryIcon`

```tsx
function CategoryIcon({ icon, color }: { icon: string; color: string })
```

Renderiza um quadrado arredondado com fundo semi-transparente (`color + "22"` — "22" em hex = ~13% de opacidade) e o ícone correspondente na cor cheia. O tamanho é `w-9 h-9` (36px).

### `TypeBadge`

```tsx
function TypeBadge({ type }: { type: "Despesa" | "Receita" })
```

Pílula colorida com seta direcional. Despesa = vermelho com ↙, Receita = verde com ↗. Usa classes Tailwind condicionais direto no className.

### `StatusBadge`

```tsx
function StatusBadge({ status }: { status: "Ativa" | "Inativa" })
```

Pílula verde para Ativa, cinza para Inativa. Simples.

### `FilterSelect`

```tsx
function FilterSelect({ value, onChange, children }: {...})
```

Wrapper de `<select>` nativo com o ícone `ChevronDown` sobreposto via `absolute`. O `appearance-none` remove o estilo padrão do browser para o select nativo e deixa só o custom. O `pointer-events-none` no ícone garante que clicar nele ainda abre o select.

---

## Estado da página

```ts
const [categories, setCategories]     // lista completa (mock ou futura API)
const [search, setSearch]             // texto de busca
const [filterType, setFilterType]     // "Todos os tipos" | "Despesa" | "Receita"
const [filterAccount, setFilterAccount] // conta selecionada
const [filterStatus, setFilterStatus] // "Todas" | "Ativas" | "Inativas"
const [sortBy, setSortBy]             // ordenação (só visual por enquanto)
const [page, setPage]                 // página atual (começa em 1)
const [itemsPerPage, setItemsPerPage] // quantos itens por página
const [modalOpen, setModalOpen]       // controla se o modal está aberto
```

---

## `accounts` (useMemo)

```ts
const accounts = useMemo(
  () => ["Todas as contas", ...Array.from(new Set(MOCK_CATEGORIES.map((c) => c.account)))],
  []
);
```

Gera a lista de opções do filtro de conta dinamicamente a partir dos dados, sem duplicatas. O `useMemo` com dependência vazia `[]` significa que só roda uma vez. Quando integrar com API, troque por um estado carregado via fetch.

---

## `filtered` (useMemo)

```ts
const filtered = useMemo(() => {
  let list = [...categories]; // cópia para não mutar o estado
  // aplica cada filtro se ativo
  if (search) list = list.filter(...)
  if (filterType !== "Todos os tipos") list = list.filter(...)
  ...
  return list;
}, [categories, search, filterType, filterAccount, filterStatus]);
```

Toda a filtragem acontece aqui, client-side. O `useMemo` garante que o cálculo só repete quando alguma das dependências mudar, não a cada render genérico.

**Por que não `useEffect` com `setState`?** Porque com `useMemo` você evita um re-render extra — o valor filtrado é calculado sincronicamente durante o render, não num ciclo posterior.

---

## Paginação

```ts
const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
```

`Math.max(1, ...)` garante que `totalPages` nunca seja 0, mesmo com lista vazia — isso evita bugs no render dos botões de página.

`slice` corta o array filtrado para exibir só a página atual. Começa em `(page - 1) * itemsPerPage` porque `page` começa em 1, não 0.

Sempre que um filtro muda, `setPage(1)` é chamado junto para evitar que o usuário fique numa página que não existe mais.

---

## `handleSaveCategory`

```ts
function handleSaveCategory(data: CategoryFormData) {
  const newCat: Category = {
    id: String(Date.now()), // ID temporário — trocar por UUID da API
    subtitle: data.description || `${...} com ${data.name.toLowerCase()}`,
    ...
  };
  setCategories((prev) => [newCat, ...prev]); // insere no topo
  setPage(1); // volta pra primeira página
}
```

Recebe o `CategoryFormData` do modal (via prop `onSave`) e converte para o tipo `Category` da página. O `subtitle` é gerado automaticamente se a descrição vier vazia.

**Para integrar com API:** trocar o `setCategories` por um `fetch` POST e, no `.then()`, adicionar o item retornado pelo backend ao estado.

---

## Layout da tabela

```tsx
className="grid grid-cols-[2fr_1fr_1.5fr_2fr_1fr_auto] gap-4 ..."
```

CSS Grid com colunas de tamanho fixo proporcional (`fr` = fração do espaço disponível). `auto` na última coluna deixa os botões de ação ocupar só o espaço que precisam.

O mesmo `grid-cols` aparece no cabeçalho e em cada linha — é isso que alinha as colunas perfeitamente sem usar `<table>`.

---

## Render condicional das linhas

```tsx
{paginated.length === 0 ? (
  <div>Nenhuma categoria encontrada...</div>
) : (
  paginated.map((cat) => (...))
)}
```

Estado vazio explícito para não mostrar uma tabela com zero linhas sem nenhuma mensagem.

---

## Render do modal

```tsx
{modalOpen && <CategoryModal onClose={...} onSave={...} />}
```

O modal só é montado no DOM quando `modalOpen` for `true`. Isso significa que toda vez que fecha e reabre, o estado interno do modal é resetado — comportamento desejado para criação.

---

## Como integrar com API

1. Trocar `useState(MOCK_CATEGORIES)` por:
```ts
const [categories, setCategories] = useState<Category[]>([]);

useEffect(() => {
  fetch("/api/categories", { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(setCategories);
}, []);
```

2. Em `handleSaveCategory`, trocar o `setCategories` local por:
```ts
fetch("/api/categories", { method: "POST", body: JSON.stringify(data), ... })
  .then(r => r.json())
  .then(newCat => setCategories(prev => [newCat, ...prev]));
```

3. Mover a filtragem e paginação para query params se o volume de dados for grande.
