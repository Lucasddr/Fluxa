# Fluxa — Telas de Categorias e Transações

## O que foi entregue

```
fluxa/
├── app/
│   └── home/
│       ├── layout.tsx                  ← sidebar atualizada (+ Categorias)
│       ├── categorias/
│       │   └── page.tsx                ← tela de categorias
│       └── transactions/
│           └── page.tsx                ← tela de transações
└── components/
    └── modals/
        ├── CategoryModal.tsx           ← modal de nova categoria
        └── TransactionModal.tsx        ← modal de nova transação
```

---

## Como usar

### 1. Copiar os arquivos

Siga a estrutura acima. Os paths de import já estão usando `@/app/...`, que é o alias padrão do Next.js.

### 2. Sidebar

Substitua seu `app/home/layout.tsx` pelo entregue. O link **Categorias** usa o slug `"categorias"` — basta criar a pasta `app/home/categorias/` (já entregue).

### 3. Modais

Coloque os modais em `app/components/modals/`. Se preferir outra pasta, ajuste os imports nas pages:

```tsx
// categorias/page.tsx
import CategoryModal from "@/app/components/modals/CategoryModal";

// transactions/page.tsx
import TransactionModal from "@/app/components/modals/TransactionModal";
```

---

## Decisões técnicas

### Dados mockados
Ambas as pages têm um array `MOCK_*` no topo do arquivo. Quando conectar a API, basta trocar o `useState(MOCK_*)` por um `useEffect` com fetch e manter o mesmo shape de tipo.

### Filtragem e paginação client-side
Toda a filtragem e paginação acontece no cliente via `useMemo`. Isso é suficiente para dados mockados e para volumes pequenos. Com API, o ideal é mover os parâmetros de filtro para query params e deixar o backend paginar.

### Modais como componentes separados
Cada modal recebe `onClose` e `onSave` via props, sem estado global. Isso mantém a lógica isolada e facilita reusar o modal em outros contextos (ex: edição de uma categoria existente — basta passar os dados iniciais como prop).

### Validação
Os dois modais fazem validação local simples antes de chamar `onSave`. Os campos obrigatórios estão marcados com borda vermelha e mensagem de erro. Quando integrar com API, adicione a validação do backend no bloco `catch` do fetch.

### Identidade visual
Todos os componentes seguem as CSS vars definidas no `globals.css` do projeto:
- `--color-interactive` (#2E7FA8) → botões primários, paginação ativa, focus rings
- `--color-primary` (#0f2d3f) → sidebar
- `--color-border` → bordas de cards e tabelas
- `--color-positive` / `--color-alert` → valores positivos/negativos

Badges de categoria usam a cor dinâmica com opacidade (`color + "18"` para fundo, `color + "40"` para borda), o que permite qualquer cor sem criar classes extras.

### CategoryIcon (categorias/page.tsx)
Um mapa estático `ICON_MAP` resolve o nome do ícone (string vinda do mock/API) para o componente Lucide correspondente. Ao adicionar novos ícones no modal, inclua-os também nesse mapa.

### Sem dependências novas
Tudo usa apenas o que já está no projeto: React, Next.js, Tailwind, Lucide React.

---

## Próximos passos sugeridos

1. **Integrar com API** — trocar os arrays mock por chamadas ao Spring Boot
2. **Edição** — o botão de lápis (categorias) e o `⋮` (transações) já estão renderizados; basta abrir o modal com os dados preenchidos
3. **Exclusão** — adicionar confirmação no menu de ações
4. **Filtro de data** — o range de datas na tela de transações está visual; conectar a um date picker real
5. **Toast de feedback** — adicionar notificação ao salvar/excluir
