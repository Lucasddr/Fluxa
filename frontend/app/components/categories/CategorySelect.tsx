"use client";

import { useState } from "react";

import CategoryModal from "@/app/components/modals/CategoryModal";
import type { CategoryFormData } from "@/app/components/modals/CategoryModal";
import Select from "@/app/components/ui/Select";
import { selectCategories } from "@/services/categories";

export type CategoryOption = {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
};

type CategorySelectProps = {
  id: string;
  value: string;
  kind: "INCOME" | "EXPENSE";
  categories: CategoryOption[];
  onChange: (categoryId: string, category?: CategoryOption) => void;
  onCategoriesChange?: (categories: CategoryOption[]) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  allowCreate?: boolean;
  className?: string;
};

const CREATE_OPTION = "__create__";

export default function CategorySelect({
  id,
  value,
  kind,
  categories,
  onChange,
  onCategoriesChange,
  disabled,
  error,
  placeholder = "Selecione uma categoria",
  allowCreate = true,
  className,
}: CategorySelectProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const options = categories.filter((category) => category.kind === kind);
  if (value && !options.some((category) => category.id === value)) {
    const current = categories.find((category) => category.id === value);
    if (current) options.push(current);
  }

  async function handleSaved(saved?: CategoryFormData) {
    if (!saved) return;
    try {
      const response = await selectCategories();
      if (!response.ok) return;
      const data = (await response.json()) as CategoryOption[];
      onCategoriesChange?.(data);
      const name = saved.name.trim().toLowerCase();
      const created = [...data]
        .reverse()
        .find(
          (category) =>
            category.name.trim().toLowerCase() === name &&
            category.kind === saved.kind
        );
      if (created) onChange(created.id, created);
    } catch {
      // The modal already surfaced the failure to the user.
    }
  }

  return (
    <>
      <Select
        id={id}
        value={value}
        disabled={disabled}
        error={error}
        className={className}
        onChange={(event) => {
          if (event.target.value === CREATE_OPTION) {
            setCreateOpen(true);
            return;
          }
          onChange(event.target.value);
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
        {allowCreate && (
          <option value={CREATE_OPTION}>
            + Criar nova categoria {kind === "INCOME" ? "de receita" : "de despesa"}
          </option>
        )}
      </Select>

      {createOpen && (
        <CategoryModal
          mode="create"
          initialData={{ kind }}
          title={`Nova categoria de ${kind === "INCOME" ? "receita" : "despesa"}`}
          description="A categoria é criada e já fica selecionada aqui."
          submitLabel="Criar categoria"
          onSave={handleSaved}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </>
  );
}
