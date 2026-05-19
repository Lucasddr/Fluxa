# transactions/page.tsx

Tela de listagem e gerenciamento de transações financeiras.

---

## Visão geral

Client Component (`"use client"`) com dados mockados. Estrutura muito similar à página de Categorias — mesmos padrões de filtragem, paginação e modal. As diferenças estão no tipo `Transaction` (mais campos), nos componentes visuais específicos (badges de categoria com cor dinâmica, ícone de forma de pagamento) e no campo de valor que precisa de formatação monetária.

---

## Tipos

```ts
type Transaction = {
  id: string;
  description: string;     // nome principal: "Salário", "Netflix"...
  subtitle: string;        // linha menor: "Recebimento", "Assinatura mensal"...
  category: string;        // nome da categoria: "Alimentação"
  categoryColor: string;   // hex para colorir o badge dinamicamente
  type: "Entrada" | "Saída";
  date: string;            // "31/05/2025" — formato display
  dateLabel: string;       // "Hoje", "Ontem", "2 dias atrás"
  paymentMethod: string;   // "Cartão de Crédito", "Pix"...
  paymentIcon: "bank" | "credit" | "debit" | "pix"; // controla o ícone visual
  account: string;
  value: number;           // positivo para Entrada, negativo para Saída
};
```

**Por que `value` é negativo para saídas?** Facilita cálculos futuros (saldo = soma de todos os values). A formatação para exibição usa `Math.abs()` e coloca o sinal manual via `t.type === "Saída" ? "-" : ""`.

**Por que `paymentIcon` é uma union type separada de `paymentMethod`?** Porque `paymentMethod` é uma string livre (pode vir de qualquer forma da API), enquanto `paymentIcon` é um conjunto fechado de 4 opções que controla qual visual renderizar. A conversão acontece em `handleSaveTransaction`.

---

## Constantes

```ts
const CATEGORIES = ["Todas as categorias", "Entradas", ...]
const PAYMENT_METHODS = ["Todos os cartões", "Conta Principal", ...]
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20]
```

Arrays usados para popular os `<select>` dos filtros. Quando integrar com API, `CATEGORIES` pode vir de um endpoint `/api/categories` ao invés de ser hardcoded.

---

## Componentes internos

### `PaymentIcon`

```tsx
function PaymentIcon({ type }: { type: Transaction["paymentIcon"] })
```

Renderiza um quadradinho colorido representando a forma de pagamento. Pix tem um ◆ rotacionado 45°. Os outros têm um retângulo menor dentro (simulando um cartão). Cores:

- `bank` → azul
- `credit` → índigo
- `debit` → roxo
- `pix` → teal

### `FilterSelect`

Idêntico ao da página de Categorias — wrapper de select nativo com ChevronDown customizado. Foi duplicado ao invés de extraído para um componente compartilhado porque as páginas são independentes por enquanto. Quando tiver uma pasta `components/ui/`, vale mover para lá.

### `TypeBadge`

```tsx
function TypeBadge({ type }: { type: "Entrada" | "Saída" })
```

Similar ao das Categorias, mas para Entrada/Saída ao invés de Despesa/Receita. Verde para Entrada, vermelho para Saída.

### `CategoryBadge`

```tsx
function CategoryBadge({ name, color }: { name: string; color: string })
```

Badge com cor totalmente dinâmica, diferente dos outros badges que usam classes Tailwind fixas. Usa `style` inline porque a cor vem de dado (não dá pra gerar classes Tailwind dinâmicas em runtime):

```tsx
style={{
  backgroundColor: color + "18",  // hex opacity ~10%
  color,
  borderColor: color + "40",       // hex opacity ~25%
}}
```

Essa técnica de concatenar sufixo hex funciona porque CSS aceita cores de 8 dígitos (#RRGGBBAA).

### `formatBRL`

```ts
function formatBRL(value: number) {
  return Math.abs(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
```

`Math.abs` porque o valor pode ser negativo no dado, mas a exibição sempre mostra positivo com o sinal controlado pelo contexto (prefixo "-" manual para saídas).

---

## Estado da página

```ts
const [transactions, setTransactions]   // lista completa
const [search, setSearch]               // busca por description ou subtitle
const [filterCategory, setFilterCategory]
const [filterType, setFilterType]       // "Todos os tipos" | "Entrada" | "Saída"
const [filterPayment, setFilterPayment] // forma de pagamento
const [sortBy, setSortBy]               // visual por enquanto
const [page, setPage]
const [itemsPerPage, setItemsPerPage]
const [modalOpen, setModalOpen]
```

---

## `filtered` (useMemo)

```ts
const filtered = useMemo(() => {
  let list = [...transactions];
  if (search) list = list.filter((t) =>
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.subtitle.toLowerCase().includes(search.toLowerCase())
  );
  if (filterCategory !== "Todas as categorias") list = list.filter(...)
  if (filterType !== "Todos os tipos") list = list.filter(...)
  if (filterPayment !== "Todos os cartões") list = list.filter(...)
  return list;
}, [transactions, search, filterCategory, filterType, filterPayment]);
```

A busca por texto cobre tanto `description` quanto `subtitle`, então buscar "mensal" encontra "Netflix" (subtitle: "Assinatura mensal").

---

## `handleSaveTransaction`

```ts
function handleSaveTransaction(data: TransactionFormData) {
  const newT: Transaction = {
    id: String(Date.now()),
    description: data.description,
    subtitle: data.notes || data.category, // usa observação ou cai na categoria
    category: data.category,
    categoryColor: "#6B7280",              // cinza neutro — sem mapeamento de cor ainda
    type: data.type,
    date: data.date,
    dateLabel: "Agora",
    paymentMethod: data.paymentMethod,
    // converte string livre para union type fechada:
    paymentIcon: data.paymentMethod.includes("Crédito") ? "credit"
               : data.paymentMethod.includes("Débito")  ? "debit"
               : data.paymentMethod === "Pix"            ? "pix"
               : "bank",
    account: data.account,
    value: data.type === "Entrada" ? parseFloat(data.value) : -parseFloat(data.value),
  };
  setTransactions((prev) => [newT, ...prev]);
  setPage(1);
}
```

**Ponto de atenção:** `categoryColor` é fixo em cinza (`#6B7280`) para transações criadas pelo modal porque não há mapeamento de categoria → cor ainda. Quando integrar com a API de categorias, buscar a cor da categoria selecionada no momento do save.

A lógica de `paymentIcon` é uma cadeia ternária que detecta a forma de pagamento por substring. É frágil — se o nome mudar na API, quebra. Com API real, o melhor é o backend devolver o tipo diretamente.

---

## Layout da tabela

```tsx
className="grid grid-cols-[2fr_1.2fr_1fr_1.5fr_1.5fr_1fr_auto] ..."
```

7 colunas: Descrição, Categoria, Tipo, Data, Forma de Pagamento, Valor, Ações. O mesmo template de colunas é usado no cabeçalho e em cada linha.

---

## Filtro de data

O range `01/05/2025 – 31/05/2025` visível nos filtros é só display — não há lógica de filtro de data implementada. Está marcado assim intencionalmente para implementar depois com um date picker real (ex: `react-day-picker`).

---

## Como integrar com API

```ts
// Carregar
useEffect(() => {
  const params = new URLSearchParams({ page, limit: itemsPerPage, search, ... });
  fetch(`/api/transactions?${params}`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(({ data, total }) => {
      setTransactions(data);
      setTotal(total); // paginação server-side
    });
}, [page, itemsPerPage, search, filterCategory, filterType, filterPayment]);

// Salvar
fetch("/api/transactions", { method: "POST", body: JSON.stringify(data), ... })
  .then(r => r.json())
  .then(newT => setTransactions(prev => [newT, ...prev]));
```

Com paginação server-side, remover o `useMemo` de `filtered` e o `slice` de `paginated` — o backend já devolve só a página certa.
