
"use client";

import { useState } from "react";

import {
  X,
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

import { api } from "@/services/api";

// ─── types ─────────────────────────────────────────────────────

type CategoryModalProps = {
  onClose: () => void;
  onSave: () => Promise<void>;
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
  {
    label: "Carrinho",
    value: "ShoppingCart",
    component: ShoppingCart,
  },
  {
    label: "Casa",
    value: "Home",
    component: Home,
  },
  {
    label: "Carro",
    value: "Car",
    component: Car,
  },
  {
    label: "Saúde",
    value: "Heart",
    component: Heart,
  },
  {
    label: "Educação",
    value: "GraduationCap",
    component: GraduationCap,
  },
  {
    label: "Lazer",
    value: "Smile",
    component: Smile,
  },
  {
    label: "Investimento",
    value: "TrendingUp",
    component: TrendingUp,
  },
  {
    label: "Trabalho",
    value: "Briefcase",
    component: Briefcase,
  },
  {
    label: "Energia",
    value: "Zap",
    component: Zap,
  },
  {
    label: "Café",
    value: "Coffee",
    component: Coffee,
  },
  {
    label: "Música",
    value: "Music",
    component: Music,
  },
  {
    label: "Viagem",
    value: "Plane",
    component: Plane,
  },
  {
    label: "Roupas",
    value: "Shirt",
    component: Shirt,
  },
  {
    label: "Alimentação",
    value: "Utensils",
    component: Utensils,
  },
  {
    label: "Dinheiro",
    value: "DollarSign",
    component: DollarSign,
  },
];

// ─── colors ────────────────────────────────────────────────────

const PresetColors = [
  "#22C55E",
  "#EF4444",
  "#F59E0B",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

// ─── component ─────────────────────────────────────────────────

export default function CategoryModal({
  onClose,
  onSave,
}: CategoryModalProps) {

  const [form, setForm] =
    useState<CategoryFormData>({
      name: "",
      kind: "EXPENSE",
      icon: "ShoppingCart",
      description: "",
      color: "#22C55E",
      status: true,
    });

  const [loading, setLoading] = useState(false);

  const [iconDropdownOpen, setIconDropdownOpen] =
    useState(false);

  const [errors, setErrors] = useState<
    Partial<Record<keyof CategoryFormData, string>>
  >({});

  // ─── selected icon ───────────────────────────────────────────

  const selectedIcon =
    IconOptions.find((i) => i.value === form.icon);

  const SelectedIconComponent =
    selectedIcon?.component ?? ShoppingCart;

  // ─── validation ──────────────────────────────────────────────

  function validate() {
    const e: typeof errors = {};

    if (!form.name.trim()) {
      e.name = "Nome é obrigatório";
    }

    return e;
  }

  // ─── save ────────────────────────────────────────────────────

  async function handleSave() {

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);

      const response = await api("/categories/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar categoria");
      }

      await onSave();

      onClose();

    } catch (error) {

      console.error(
        "Erro ao salvar categoria:",
        error
      );

    } finally {

      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Nova Categoria
            </h2>

            <p className="text-sm text-gray-400 mt-0.5">
              Preencha os dados abaixo para criar uma nova categoria.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">

          {/* Tipo + Nome */}
          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Tipo
              </label>

              <div className="flex gap-2">

                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        kind: t,
                      }))
                    }
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition
                    ${
                      form.kind === t
                        ? t === "EXPENSE"
                          ? "bg-red-50 border-red-300 text-red-600"
                          : "bg-green-50 border-green-300 text-green-600"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {t === "EXPENSE"
                      ? "↙ Despesa"
                      : "↗ Receita"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Nome da categoria
              </label>

              <input
                type="text"
                placeholder="Ex.: Alimentação"
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                  }));

                  setErrors((e2) => ({
                    ...e2,
                    name: undefined,
                  }));
                }}
                className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-800 focus:outline-none focus:ring-2 transition
                ${
                  errors.name
                    ? "border-red-400 focus:ring-red-200"
                    : "border-gray-200 focus:ring-(--color-interactive)/30"
                }`}
              />

              {errors.name && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.name}
                </p>
              )}

              <p className="text-xs text-gray-400 mt-1">
                Nome que identifica a categoria
              </p>
            </div>
          </div>

          {/* Ícone */}
          <div>

            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Ícone
            </label>

            <div className="flex items-center gap-3">

              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: form.color + "22",
                }}
                onClick={() =>
                    setIconDropdownOpen((o) => !o)
                  }
              >
                <SelectedIconComponent
                  className="w-5 h-5"
                  style={{
                    color: form.color,
                  }}
                />
              </div>

              <div className="relative flex-1">

                <button
                  type="button"
                  onClick={() =>
                    setIconDropdownOpen((o) => !o)
                  }
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  <span>
                    {selectedIcon?.label ??
                      "Selecionar ícone"}
                  </span>

                  <span className="text-gray-400">
                    ▾
                  </span>
                </button>

                {iconDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-10 grid grid-cols-5 gap-1 p-2 max-h-40 overflow-y-auto">

                    {IconOptions.map(
                      ({
                        label,
                        value,
                        component: IconComp,
                      }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              icon: value,
                            }));

                            setIconDropdownOpen(false);
                          }}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition text-xs text-gray-600
                          ${
                            form.icon === value
                              ? "bg-gray-100"
                              : ""
                          }`}
                        >
                          <IconComp className="w-4 h-4" />

                          <span className="leading-tight text-center">
                            {label}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-1.5">
              Escolha um ícone para representar a categoria
            </p>
          </div>

          {/* Descrição */}
          <div>

            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Descrição{" "}
              <span className="text-gray-400 font-normal">
                (opcional)
              </span>
            </label>

            <textarea
              placeholder="Ex.: Despesas com alimentação em restaurantes, mercado, etc."
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-(--color-interactive)/30 transition"
            />

            <p className="text-xs text-gray-400 mt-1">
              Descreva brevemente o propósito desta categoria
            </p>
          </div>

          {/* Cor */}
          <div>

            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Cor
            </label>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200">

              <div
                className="w-5 h-5 rounded-full shrink-0"
                style={{
                  backgroundColor: form.color,
                }}
              />

              <input
                type="text"
                value={form.color}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    color: e.target.value,
                  }))
                }
                className="flex-1 text-sm text-gray-700 focus:outline-none bg-transparent"
                placeholder="#22C55E"
              />
            </div>

            <div className="flex gap-1.5 mt-2 flex-wrap">

              {PresetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      color: c,
                    }))
                  }
                  className={`w-5 h-5 rounded-full border-2 transition
                  ${
                    form.color === c
                      ? "border-gray-400 scale-110"
                      : "border-transparent"
                  }`}
                  style={{
                    backgroundColor: c,
                  }}
                />
              ))}
            </div>

            <p className="text-xs text-gray-400 mt-1">
              Cor que representa a categoria
            </p>
          </div>

          {/* Status */}
          <div>

            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Status
            </label>

            <div className="border border-gray-200 rounded-xl">

              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    status: !f.status,
                  }))
                }
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">

                  <div
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0
                    ${
                      form.status
                        ? "bg-[var(--color-interactive)]"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                      ${
                        form.status
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </div>

                  <div className="text-left">

                    <p className="text-sm font-medium text-gray-800">
                      Categoria ativa
                    </p>

                    <p className="text-xs text-gray-400">
                      Define se essa categoria ficará ativa
                    </p>
                  </div>
                </div>

                <span className="text-gray-400 text-xs">
                  ▾
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">

          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 rounded-lg border shadow-lg border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2 rounded-lg shadow-lg text-sm font-semibold text-white transition disabled:opacity-50"
            style={{
              backgroundColor:
                "var(--color-interactive)",
            }}
          >
            {loading
              ? "Salvando..."
              : "Salvar Categoria"}
          </button>
        </div>
      </div>
    </div>
  );
}
