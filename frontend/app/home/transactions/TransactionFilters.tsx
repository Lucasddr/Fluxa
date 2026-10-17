import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import FilterSelect from "@/app/components/ui/FilterSelect";

type PaymentMethod = {
  value: string;
  label: string;
};

type TransactionFiltersProps = {
  categories: string[];
  paymentMethods: PaymentMethod[];
  search: string;
  category: string;
  kind: string;
  paymentMethod: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onKindChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
};

export default function TransactionFilters({
  categories,
  paymentMethods,
  search,
  category,
  kind,
  paymentMethod,
  onSearchChange,
  onCategoryChange,
  onKindChange,
  onPaymentMethodChange,
}: TransactionFiltersProps) {
  const activeFilterCount =
    Number(category !== categories[0]) +
    Number(kind !== "Todos os tipos") +
    Number(paymentMethod !== paymentMethods[0]?.value);

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full min-w-0 flex-1 sm:min-w-[180px]">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Buscar..."
          aria-label="Buscar transações"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="min-h-11 w-full rounded-[var(--radius)] border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-3 transition-colors focus:border-ink-3 focus:outline-none"
        />
      </div>

      <details className="group w-full sm:w-auto">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-[var(--radius)] border border-line px-3 text-sm font-medium text-ink-2 sm:hidden [&::-webkit-details-marker]:hidden">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-paper">
                {activeFilterCount}{" "}
                {activeFilterCount === 1 ? "ativo" : "ativos"}
              </span>
            )}
            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>

        <div className="mt-2 grid w-full grid-cols-1 gap-2 sm:mt-0 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <FilterSelect
            fullWidth
            label="Filtrar por categoria"
            value={category}
            onChange={onCategoryChange}
          >
            {categories.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </FilterSelect>

          <FilterSelect
            fullWidth
            label="Filtrar por tipo"
            value={kind}
            onChange={onKindChange}
          >
            <option>Todos os tipos</option>
            <option>Entrada</option>
            <option>Saída</option>
          </FilterSelect>

          <FilterSelect
            fullWidth
            label="Filtrar por forma de pagamento"
            value={paymentMethod}
            onChange={onPaymentMethodChange}
          >
            {paymentMethods.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>
        </div>
      </details>
    </div>
  );
}
