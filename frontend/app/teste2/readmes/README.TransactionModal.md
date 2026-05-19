# TransactionModal.tsx

Modal de criação de nova transação financeira.

---

## Visão geral

Client Component com estrutura idêntica ao `CategoryModal` — overlay fixo, header/body/footer, validação antes do save, props `onClose` e `onSave`. A diferença está nos campos (mais campos, mais variados) e em alguns detalhes de UX como o input de valor com prefixo "R$" e o toggle de transação recorrente.

---

## Tipos exportados

```ts
type TransactionModalProps = {
  onClose: () => void;
  onSave: (transaction: TransactionFormData) => void;
};

export type TransactionFormData = {
  type: "Entrada" | "Saída";
  value: string;          // string, não number — input type="number" retorna string
  category: string;
  date: string;           // formato ISO: "2025-05-31"
  paymentMethod: string;
  account: string;
  description: string;
  notes: string;
  recurring: boolean;
};
```

**Por que `value` é `string` e não `number`?** Porque `<input type="number">` retorna `e.target.value` como string. Converter para number só na hora de salvar (`parseFloat(data.value)`) é mais seguro — evita bugs com input vazio (`""` vira `NaN` se convertido cedo).

**`date` em formato ISO** (`YYYY-MM-DD`): é o que o `<input type="date">` usa nativamente. A exibição formatada (`31/05/2025`) é responsabilidade da página de listagem, não do modal.

---

## Constantes

```ts
const CATEGORIES = ["Alimentação", "Salário", "Moradia", ...]
const PAYMENT_METHODS = ["Conta Principal", "Cartão de Crédito", "Cartão de Débito", "Pix"]
const ACCOUNTS = ["Conta Principal", "Conta de Investimentos", "Conta Poupança"]
const TODAY = new Date().toISOString().split("T")[0] // "2025-05-31"
```

`TODAY` é calculado uma vez quando o módulo carrega (fora do componente), não a cada render. É usado como valor inicial do campo `date`.

---

## Estado do componente

```ts
const [form, setForm] = useState<TransactionFormData>({
  type: "Entrada",
  value: "",
  category: "",
  date: TODAY,
  paymentMethod: "",
  account: "",
  description: "",
  notes: "",
  recurring: false,
});

const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormData, string>>>({});
```

Um objeto único para todos os campos do formulário. Mesmo padrão do `CategoryModal`.

---

## Validação

```ts
function validate() {
  const e: typeof errors = {};
  if (!form.value || parseFloat(form.value) <= 0) e.value = "Informe um valor válido";
  if (!form.category)              e.category    = "Selecione uma categoria";
  if (!form.description.trim())    e.description = "Descrição é obrigatória";
  if (!form.paymentMethod)         e.paymentMethod = "Selecione a forma de pagamento";
  if (!form.account)               e.account     = "Selecione uma conta";
  return e;
}
```

5 campos obrigatórios. O valor precisa ser maior que 0 — `parseFloat("") = NaN`, e `NaN <= 0` é `false`, por isso o `!form.value` vem antes para pegar o caso de string vazia.

`notes` e `date` não são validados: `date` já tem valor inicial (`TODAY`) e `notes` é opcional.

---

## Helper `field`

```ts
function field(key: keyof TransactionFormData, value: string) {
  setForm((f) => ({ ...f, [key]: value }));
  setErrors((e) => ({ ...e, [key]: undefined }));
}
```

Função utilitária que atualiza um campo do form E limpa o erro desse campo ao mesmo tempo. Usada nos `onChange` dos selects e inputs de texto. O `[key]` é uma computed property — o nome da chave é dinâmico.

Por que não usar para o `textarea` de `notes`? Porque `notes` não tem validação, então não precisa limpar erro. O `setForm` direto é suficiente.

---

## Helper `inputClass`

```ts
const inputClass = (err?: string) =>
  `w-full px-3 py-2 rounded-lg border text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 transition
  ${err ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-(--color-interactive)/30"}`;
```

Função que gera a classe CSS do input baseado em se tem erro ou não. Evita repetir o mesmo bloco condicional em cada campo. Usada como `className={inputClass(errors.campo)}`.

---

## Input de valor com prefixo "R$"

```tsx
<div className={`flex items-center border rounded-lg overflow-hidden transition
  ${errors.value ? "border-red-400" : "border-gray-200 focus-within:ring-2 ..."}`}>
  
  <span className="px-3 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 py-2 shrink-0">
    R$
  </span>
  
  <input
    type="number"
    min="0"
    step="0.01"
    placeholder="0,00"
    value={form.value}
    onChange={(e) => field("value", e.target.value)}
    className="flex-1 px-3 py-2 text-sm text-gray-800 focus:outline-none bg-white"
  />
</div>
```

O "R$" e o input ficam dentro de um mesmo `div` com borda. O `focus-within:ring-2` aplica o ring quando **qualquer filho** estiver em foco — funciona porque o input está dentro do div.

`overflow-hidden` no container garante que o border-radius apareça nos cantos com o prefixo.

`step="0.01"` permite centavos. `min="0"` previne valor negativo no input (a negatividade é controlada pelo tipo Entrada/Saída, não pelo valor em si).

---

## Toggle Entrada/Saída

```tsx
{(["Entrada", "Saída"] as const).map((t) => (
  <button
    key={t}
    onClick={() => setForm(f => ({ ...f, type: t }))}
    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition
      ${form.type === t
        ? t === "Entrada"
          ? "bg-green-50 border-green-300 text-green-600"
          : "bg-red-50 border-red-300 text-red-600"
        : "border-gray-200 text-gray-500 hover:bg-gray-50"
      }`}
  >
    {t === "Entrada" ? "↗ Entrada" : "↙ Saída"}
  </button>
))}
```

`as const` faz o TypeScript inferir o tipo como `("Entrada" | "Saída")[]` ao invés de `string[]`, permitindo usar os valores para atualizar `form.type` que é tipado como `"Entrada" | "Saída"`.

O estilo condicional tem 3 níveis: selecionado+verde, selecionado+vermelho, não selecionado.

---

## Input de data

```tsx
<input
  type="date"
  value={form.date}
  onChange={(e) => field("date", e.target.value)}
  className={inputClass()}
/>
```

Usa o date picker nativo do browser. Valor em formato ISO (`YYYY-MM-DD`). Sem validação porque já tem o `TODAY` como default — o usuário sempre vai ter uma data válida.

---

## Toggle de transação recorrente

```tsx
<div className="border border-gray-200 rounded-xl overflow-hidden">
  <button
    onClick={() => setForm(f => ({ ...f, recurring: !f.recurring }))}
    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
  >
    <div className="flex items-center gap-3">
      {/* Switch visual */}
      <div style={{ backgroundColor: form.recurring ? "var(--color-interactive)" : "#D1D5DB" }}>
        <span className={form.recurring ? "translate-x-4" : "translate-x-0.5"} />
      </div>

      {/* Texto */}
      <div>
        <p>Transação recorrente</p>
        <p>Repete esta transação automaticamente</p>
      </div>
    </div>

    {/* Seta de expansão (visual only) */}
    <span>▾</span>
  </button>
</div>
```

O `▾` no canto direito sugere que ao ativar a recorrência apareceriam opções de frequência (diária, semanal, mensal). Isso não está implementado — é um placeholder para iteração futura.

O botão inteiro é clicável (não só o switch) — `w-full` e `onClick` no `<button>` externo.

---

## Footer e `handleSave`

```ts
function handleSave() {
  const e = validate();
  if (Object.keys(e).length > 0) { setErrors(e); return; }
  onSave(form);
  onClose();
}
```

Sequência: valida → se tem erro, seta erros e para. Se não tem erro, chama `onSave` com o form e fecha o modal. O pai recebe o dado e faz o que quiser com ele (adicionar ao estado, enviar para API, etc).

---

## Como adaptar para edição

```tsx
type TransactionModalProps = {
  onClose: () => void;
  onSave: (transaction: TransactionFormData) => void;
  initialData?: Partial<TransactionFormData>; // novo
  mode?: "create" | "edit";                  // novo
};

const [form, setForm] = useState<TransactionFormData>({
  type: "Entrada",
  value: "",
  date: TODAY,
  ...
  ...initialData, // override com dados existentes
});
```

No submit, checar `mode` para fazer PUT ao invés de POST:

```ts
onSave(form); // pai decide se é POST ou PUT baseado em se tem id
```

---

## Diferenças em relação ao CategoryModal

| Aspecto | CategoryModal | TransactionModal |
|---|---|---|
| Campos | 6 | 9 |
| Validação | 2 campos | 5 campos |
| Input especial | Dropdown de ícone + color picker | Input de valor com prefixo R$ |
| Toggle | Status ativo/inativo | Recorrente |
| Ícones importados | 15 Lucide | Só `X` |
| Helper de classe | Não tem | `inputClass()` |
| Helper de update | Não tem | `field()` |
