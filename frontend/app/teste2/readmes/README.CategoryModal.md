# CategoryModal.tsx

Modal de criação de nova categoria financeira.

---

## Visão geral

Client Component que renderiza um overlay com formulário. Recebe `onClose` e `onSave` como props — não tem estado próprio de "aberto/fechado", quem controla isso é a página pai. Quando o usuário salva com sucesso, chama `onSave(form)` e depois `onClose()`. Se cancelar, só chama `onClose()`.

---

## Tipos exportados

```ts
// Props do componente
type CategoryModalProps = {
  onClose: () => void;
  onSave: (category: CategoryFormData) => void;
};

// Dado que o modal devolve para o pai
export type CategoryFormData = {
  type: "Despesa" | "Receita";
  name: string;
  icon: string;        // chave do ícone, ex: "ShoppingCart"
  description: string;
  account: string;
  color: string;       // hex, ex: "#22C55E"
  active: boolean;
};
```

`CategoryFormData` é exportado porque a página pai (`categorias/page.tsx`) precisa dele para tipar o parâmetro do `handleSaveCategory`.

---

## Constantes

### `ICON_OPTIONS`

```ts
const ICON_OPTIONS = [
  { label: "Carrinho", value: "ShoppingCart", component: ShoppingCart },
  ...
]
```

Cada entrada tem 3 campos: `label` para exibição, `value` para armazenar no estado (e enviar para a API), `component` para renderizar no dropdown e no preview. São 15 ícones no total.

**Atenção:** se adicionar um novo ícone aqui, também precisa adicioná-lo no `ICON_MAP` em `categorias/page.tsx`, ou a tabela vai mostrar o fallback.

### `ACCOUNT_OPTIONS`

```ts
const ACCOUNT_OPTIONS = ["Conta Principal", "Conta de Investimentos", "Conta Poupança"];
```

Hardcoded por enquanto. Com API, vem de um endpoint `/api/accounts`.

### `PRESET_COLORS`

```ts
const PRESET_COLORS = ["#22C55E", "#EF4444", "#F59E0B", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];
```

8 cores de atalho embaixo do input de cor. O usuário pode clicar nelas ou digitar qualquer hex manualmente no input.

---

## Estado do componente

```ts
const [form, setForm] = useState<CategoryFormData>({
  type: "Despesa",
  name: "",
  icon: "ShoppingCart",
  description: "",
  account: "",
  color: "#22C55E",
  active: true,
});

const [iconDropdownOpen, setIconDropdownOpen] = useState(false);
const [errors, setErrors]  = useState<Partial<Record<keyof CategoryFormData, string>>>({});
```

**Por que um único objeto `form` ao invés de um `useState` por campo?**
Porque todos os campos fazem parte do mesmo dado coeso. Atualizar com `setForm(f => ({ ...f, campo: valor }))` mantém os outros campos intactos. É o padrão mais comum para formulários com múltiplos campos em React.

**`Partial<Record<keyof CategoryFormData, string>>`** — tipo para os erros: um objeto onde cada chave pode ou não ter uma string de erro. `Partial` significa que não precisa ter todas as chaves, só as que têm erro.

---

## Preview do ícone

```ts
const selectedIcon = ICON_OPTIONS.find((i) => i.value === form.icon);
const SelectedIconComponent = selectedIcon?.component ?? ShoppingCart;
```

Derivado do estado `form.icon`, não é um estado separado. Toda vez que `form.icon` muda, o componente re-renderiza e essas variáveis são recalculadas. O preview ao lado do dropdown usa `SelectedIconComponent` com a cor atual de `form.color`.

---

## Validação

```ts
function validate() {
  const e: typeof errors = {};
  if (!form.name.trim()) e.name = "Nome é obrigatório";
  if (!form.account)     e.account = "Selecione uma conta";
  return e;
}

function handleSave() {
  const e = validate();
  if (Object.keys(e).length > 0) { setErrors(e); return; } // bloca o save
  onSave(form);
  onClose();
}
```

Validação simples e síncrona. Campos obrigatórios: `name` e `account`. Os outros são opcionais.

**Limpeza de erro por campo:** ao alterar um campo com erro, o erro some imediatamente:
```tsx
onChange={(e) => {
  setForm(f => ({ ...f, name: e.target.value }));
  setErrors(e2 => ({ ...e2, name: undefined })); // remove o erro desse campo
}}
```

---

## Overlay e estrutura visual

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
    {/* Header | Body | Footer */}
  </div>
</div>
```

- `fixed inset-0` → cobre toda a tela
- `z-50` → fica na frente de tudo
- `bg-black/40` → overlay escuro semi-transparente
- `backdrop-blur-sm` → desfoca levemente o conteúdo atrás
- `max-w-lg` → largura máxima de 512px, com `mx-4` de margem em telas pequenas
- `overflow-hidden` → garante que o body scrollável não vaze para fora do rounded

O body tem `max-h-[70vh] overflow-y-auto` para ser scrollável em telas menores sem empurrar o footer para fora da tela.

---

## Selector de ícone (dropdown customizado)

```tsx
<button onClick={() => setIconDropdownOpen(o => !o)}>
  {selectedIcon?.label ?? "Selecionar ícone"} ▾
</button>

{iconDropdownOpen && (
  <div className="absolute top-full ... grid grid-cols-5 gap-1 p-2 max-h-40 overflow-y-auto">
    {ICON_OPTIONS.map(({ label, value, component: IconComp }) => (
      <button
        onClick={() => { setForm(f => ({ ...f, icon: value })); setIconDropdownOpen(false); }}
        className={form.icon === value ? "bg-gray-100" : ""}
      >
        <IconComp className="w-4 h-4" />
        <span>{label}</span>
      </button>
    ))}
  </div>
)}
```

É um dropdown manual (não usa `<select>`) porque precisa renderizar os ícones SVG como opções, o que não é possível com select nativo. A lista tem `max-h-40 overflow-y-auto` para não transbordar. Fecha automaticamente ao selecionar um ícone.

**Limitação atual:** não fecha ao clicar fora. Para implementar isso, usar `useEffect` com `document.addEventListener("click", ...)` ou uma biblioteca como `@headlessui/react`.

---

## Toggle de status (switch customizado)

```tsx
<button
  onClick={() => setForm(f => ({ ...f, active: !f.active }))}
  style={{ backgroundColor: form.active ? "var(--color-interactive)" : undefined }}
  className={`relative w-10 h-6 rounded-full ...`}
>
  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
    ${form.active ? "translate-x-4" : "translate-x-0.5"}`}
  />
</button>
```

Toggle construído com CSS puro: um botão arredondado e um círculo branco que se move horizontalmente via `translate-x`. A cor de fundo usa `style` inline porque `--color-interactive` é uma CSS var do projeto — classes Tailwind dinâmicas não funcionam com variáveis custom em runtime.

---

## Color picker

```tsx
{/* Input de texto para digitar hex */}
<input type="text" value={form.color} onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))} />

{/* Swatches de cor preset */}
{PRESET_COLORS.map((c) => (
  <button
    onClick={() => setForm(f => ({ ...f, color: c }))}
    className={`w-5 h-5 rounded-full border-2 ${form.color === c ? "border-gray-400 scale-110" : "border-transparent"}`}
    style={{ backgroundColor: c }}
  />
))}
```

Dois modos de seleção: digitar o hex manualmente ou clicar em um swatch. O swatch ativo ganha `border-gray-400 scale-110` para indicar seleção. O preview (quadrado com ícone no topo) reflete a cor em tempo real porque usa `form.color` diretamente.

---

## Footer

```tsx
<div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
  <button onClick={onClose}>Cancelar</button>
  <button onClick={handleSave}>Salvar Categoria</button>
</div>
```

Separado do body com borda superior e fundo levemente cinza. Sempre visível — não scrolla junto com o body.

---

## Como adaptar para edição

O modal foi feito para criação, mas aceita edição com pequenas mudanças:

```tsx
// Adicionar prop opcional com dados iniciais
type CategoryModalProps = {
  onClose: () => void;
  onSave: (category: CategoryFormData) => void;
  initialData?: Partial<CategoryFormData>; // novo
};

// Inicializar form com os dados recebidos
const [form, setForm] = useState<CategoryFormData>({
  type: "Despesa",
  name: "",
  ...
  ...initialData, // spread por cima dos defaults
});
```

Também mudar o título de "Nova Categoria" para "Editar Categoria" condicionalmente.
