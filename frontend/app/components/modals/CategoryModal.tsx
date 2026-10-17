"use client";

import { useState } from "react";
import {
  ShoppingCart,
  Home,
  Car,
  Heart,
  GraduationCap,
  Smile,
  TrendingUp,
  Briefcase,
  Zap,
  Coffee,
  Music,
  Plane,
  Shirt,
  Utensils,
  DollarSign,
} from "lucide-react";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import AppDialog from "@/app/components/ui/Dialog";
import FormAlert from "@/app/components/ui/FormAlert";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Label from "@/app/components/ui/Label";
import Textarea from "@/app/components/ui/Textarea";

import { friendlyHttpError, HttpError } from "@/app/utils/http";
import {
  createCategory,
  updateCategory,
} from "@/services/categories";

// ─── types ─────────────────────────────────────────────────────

type CategoryModalProps = {
  onClose: () => void;
  onSave: () => Promise<void>;
  title: string;
  description: string;
  submitLabel: string;
  initialData?: Partial<CategoryFormData>;
  mode?: "create" | "edit";
  categoryId?: string;
};

export type CategoryFormData = {
  name: string;
  kind: "EXPENSE" | "INCOME";
  icon: string;
  description: string;
  color: string;
  status: boolean;
};

// ─── icons ─────────────────────────────────────────────────────

const IconOptions = [
  { label: "Carrinho", value: "ShoppingCart", component: ShoppingCart },
  { label: "Casa", value: "Home", component: Home },
  { label: "Carro", value: "Car", component: Car },
  { label: "Saúde", value: "Heart", component: Heart },
  { label: "Educação", value: "GraduationCap", component: GraduationCap },
  { label: "Lazer", value: "Smile", component: Smile },
  { label: "Investimento", value: "TrendingUp", component: TrendingUp },
  { label: "Trabalho", value: "Briefcase", component: Briefcase },
  { label: "Energia", value: "Zap", component: Zap },
  { label: "Café", value: "Coffee", component: Coffee },
  { label: "Música", value: "Music", component: Music },
  { label: "Viagem", value: "Plane", component: Plane },
  { label: "Roupas", value: "Shirt", component: Shirt },
  { label: "Alimentação", value: "Utensils", component: Utensils },
  { label: "Dinheiro", value: "DollarSign", component: DollarSign },
];

// ─── colors ────────────────────────────────────────────────────

const PresetColors = [
  "#1D6F4A",
  "#B3322A",
  "#B7791F",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#0D9488",
  "#EA580C",
];

// ─── component ─────────────────────────────────────────────────

export default function CategoryModal({
  onClose,
  onSave,
  title,
  description,
  submitLabel,
  initialData,
  mode = "create",
  categoryId,
}: CategoryModalProps) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState<CategoryFormData>({
    name: initialData?.name ?? "",
    kind: initialData?.kind ?? "EXPENSE",
    icon: initialData?.icon ?? "ShoppingCart",
    description: initialData?.description ?? "",
    color: initialData?.color ?? "#1D6F4A",
    status: initialData?.status ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CategoryFormData, string>>
  >({});
  const [serverError, setServerError] = useState<string | null>(null);

  const selectedIcon = IconOptions.find((i) => i.value === form.icon);
  const SelectedIconComponent = selectedIcon?.component ?? ShoppingCart;

  function validate() {
    const e: typeof errors = {};

    if (!form.name.trim()) {
      e.name = "Nome é obrigatório";
    }

    return e;
  }

  async function handleSave() {
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setServerError(null);

    try {
      setLoading(true);

      const response = isEdit
        ? await updateCategory(categoryId ?? "", {
            name: form.name,
            icon: form.icon,
            description: form.description,
            color: form.color,
            status: form.status,
          })
        : await createCategory(form);

      if (!response.ok) {
        throw new HttpError(response.status);
      }

      await onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);

      setServerError(
        error instanceof HttpError
          ? friendlyHttpError(error.status)
          : "Não foi possível salvar. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppDialog
      open
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>

          <Button onClick={handleSave} loading={loading} disabled={loading}>
            {submitLabel}
          </Button>
        </>
      }
    >
      {/* Tipo + Nome */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tipo</Label>

          <div className="flex gap-2">
            {(["EXPENSE", "INCOME"] as const).map((t) => (
              <button
                key={t}
                type="button"
                disabled={isEdit}
                onClick={() =>
                  setForm((f) => ({ ...f, kind: t }))
                }
                className={`flex-1 py-2 px-3 rounded-[var(--radius)] text-sm font-medium border transition-colors duration-[var(--dur-fast)] disabled:opacity-50 disabled:cursor-not-allowed ${
                  form.kind === t
                    ? t === "EXPENSE"
                      ? "bg-negative-subtle border-negative/30 text-negative"
                      : "bg-positive-subtle border-positive/30 text-positive"
                    : "border-line text-ink-2 hover:text-ink hover:border-ink-3"
                }`}
              >
                {t === "EXPENSE" ? "↙ Despesa" : "↗ Receita"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="category-name">Nome da categoria</Label>

          <Input
            id="category-name"
            type="text"
            placeholder="Ex.: Alimentação"
            value={form.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }));
              setErrors((e2) => ({ ...e2, name: undefined }));
            }}
            error={errors.name}
          />
        </div>
      </div>

      {/* Ícone */}
      <div>
        <Label>Ícone</Label>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="w-full flex items-center gap-3 text-left min-h-[48px] px-3 rounded-[var(--radius)] border border-line bg-surface hover:bg-line-subtle transition-colors"
            >
              <span
                className="w-9 h-9 rounded-[var(--radius)] flex items-center justify-center shrink-0"
                style={{ backgroundColor: form.color + "22" }}
              >
                <SelectedIconComponent
                  className="w-5 h-5"
                  style={{ color: form.color }}
                />
              </span>

              <span className="flex-1 text-sm text-ink">
                {selectedIcon?.label ?? "Selecionar ícone"}
              </span>

              <span className="text-ink-3 text-xs">▾</span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={4}
              collisionPadding={8}
              className="z-[60] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-48 overflow-y-auto bg-paper border border-line rounded-[var(--radius)] p-2 shadow-md"
            >
              <div className="grid grid-cols-5 gap-1">
                {IconOptions.map(({ label, value, component: IconComp }) => (
                  <DropdownMenu.Item
                    key={value}
                    onSelect={() => {
                      setForm((f) => ({ ...f, icon: value }));
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-[var(--radius-sm)] outline-none cursor-pointer transition-colors text-xs text-ink-2 hover:bg-line-subtle data-[highlighted]:bg-line-subtle ${
                      form.icon === value ? "bg-line-subtle" : ""
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span className="leading-tight text-center">{label}</span>
                  </DropdownMenu.Item>
                ))}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Descrição */}
      <div>
        <Label htmlFor="category-description" optional>
          Descrição
        </Label>

        <Textarea
          id="category-description"
          placeholder="Ex.: Despesas com alimentação em restaurantes, mercado, etc."
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          rows={3}
        />
      </div>

      {/* Cor */}
      <div>
        <Label htmlFor="category-color">Cor</Label>

        <div className="flex items-center gap-2 px-3.5 min-h-[48px] rounded-[var(--radius)] border border-line bg-surface">
          <div
            className="w-5 h-5 rounded-full shrink-0"
            style={{ backgroundColor: form.color }}
          />

          <input
            id="category-color"
            type="text"
            value={form.color}
            onChange={(e) =>
              setForm((f) => ({ ...f, color: e.target.value }))
            }
            className="flex-1 text-sm text-ink focus:outline-none bg-transparent"
            placeholder="#1D6F4A"
          />
        </div>

        <div className="flex gap-1.5 mt-2 flex-wrap">
          {PresetColors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: c }))}
              className={`w-6 h-6 rounded-full border-2 transition ${
                form.color === c
                  ? "border-ink scale-110"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="border border-line rounded-[var(--radius)]">
        <button
          type="button"
          onClick={() =>
            setForm((f) => ({ ...f, status: !f.status }))
          }
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 ${
                form.status ? "bg-ink" : "bg-line"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                  form.status ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>

            <div className="text-left">
              <p className="text-sm text-ink">Categoria ativa</p>
              <p className="text-xs text-ink-3">
                Define se essa categoria ficará ativa
              </p>
            </div>
          </div>
        </button>
      </div>

      {serverError && <FormAlert>{serverError}</FormAlert>}
    </AppDialog>
  );
}
