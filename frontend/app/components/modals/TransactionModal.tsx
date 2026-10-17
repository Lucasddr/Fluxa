"use client";

import { useEffect, useState } from "react";

import AppDialog from "@/app/components/ui/Dialog";
import FormAlert from "@/app/components/ui/FormAlert";
import { friendlyHttpError, HttpError } from "@/app/utils/http";

import { selectCategories } from "@/services/categories";
import { formatCurrency } from "@/app/utils/Formatters";

type TransactionModalProps = {
  onClose: () => void;
  onSave: (transaction: TransactionFormData) => void | Promise<void>;
  title: string;
  description: string;
  submitLabel: string;
  initialData?: Partial<TransactionFormData>;
  mode?: "create" | "edit";
};

export type TransactionFormData = {
  categoryId: string;
  kind: "EXPENSE" | "INCOME";
  amount: number;
  description: string;
  occurredAt: string;
  observation: string;
  paymentMethod: string;
  recurring: boolean;
};

type CategoriesSelect = {
  id: string;
  name: string;
  kind: string;
};

const PaymentMethods = [
  { value: "PIX", label: "Pix" },
  {
    value: "CREDIT",
    label: "Cartão de Crédito",
  },
  {
    value: "DEBIT",
    label: "Cartão de Débito",
  },
  {
    value: "CASH",
    label: "Dinheiro",
  },
  {
    value: "OTHER",
    label: "Outro",
  },
];

const TODAY =
  new Date()
    .toISOString()
    .split("T")[0];

export default function TransactionModal({
  onClose,
  onSave,
  title,
  description,
  submitLabel,
  initialData,
  mode = "create",
}: TransactionModalProps) {

  const isEdit = mode === "edit";

  const [categories, setCategories] =
    useState<CategoriesSelect[]>([]);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [amountInput, setAmountInput] =
    useState(
      initialData?.amount
        ? formatCurrency(initialData.amount)
        : ""
    );

  const [form, setForm] =
    useState<TransactionFormData>({
      categoryId: initialData?.categoryId ?? "",
      kind: initialData?.kind ?? "INCOME",
      amount: initialData?.amount ?? 0,
      description: initialData?.description ?? "",
      occurredAt: initialData?.occurredAt ?? TODAY,
      paymentMethod: initialData?.paymentMethod ?? "",
      observation: initialData?.observation ?? "",
      recurring: initialData?.recurring ?? false,
    });

  const [saving, setSaving] = useState(false);

  const [serverError, setServerError] =
    useState<string | null>(null);

  const [errors, setErrors] = useState<
    Partial<
      Record<
        keyof TransactionFormData,
        string
      >
    >
  >({});

  useEffect(() => {

    async function fetchCategories() {

      try {

        setLoadingCategories(true);

        const response = await selectCategories();

        if (!response.ok) {
          throw new Error(
            "Erro ao buscar categorias"
          );
        }

        const data:
          CategoriesSelect[] =
          await response.json();

        setCategories(data);

      } catch (err) {

        console.error(
          "Erro ao carregar categorias:",
          err
        );

      } finally {

        setLoadingCategories(false);
      }
    }

    fetchCategories();

  }, []);

  function handleAmountChange(
    value: string
  ) {

    const digits =
      value.replace(/\D/g, "");

    const amount =
      Number(digits) / 100;

    setAmountInput(
      digits
        ? formatCurrency(amount)
        : ""
    );

    setForm((f) => ({
      ...f,
      amount,
    }));

    setErrors((e) => ({
      ...e,
      amount: undefined,
    }));
  }

  function validate() {

    const e: typeof errors = {};

    if (
      !form.amount ||
      form.amount <= 0
    ) {
      e.amount =
        "Informe um valor válido";
    }

    if (!form.categoryId) {
      e.categoryId =
        "Selecione uma categoria";
    }

    if (
      !form.description.trim()
    ) {
      e.description =
        "Descrição é obrigatória";
    }

    if (!form.paymentMethod) {
      e.paymentMethod =
        "Selecione a forma de pagamento";
    }

    return e;
  }

  async function handleSave() {

    const e = validate();

    if (
      Object.keys(e).length > 0
    ) {
      setErrors(e);
      return;
    }

    setServerError(null);
    setSaving(true);

    try {
      await onSave(form);
    } catch (err) {
      console.error(
        "Erro ao salvar transação:",
        err
      );

      setServerError(
        err instanceof HttpError
          ? friendlyHttpError(err.status)
          : "Não foi possível salvar. Tente novamente."
      );
    } finally {
      setSaving(false);
    }
  }

  function field(
    key: keyof TransactionFormData,
    value: string
  ) {

    setForm((f) => ({
      ...f,
      [key]: value,
    }));

    setErrors((e) => ({
      ...e,
      [key]: undefined,
    }));
  }

  const inputClass = (
    err?: string
  ) =>
    `
      w-full px-3.5 min-h-[48px] rounded-[var(--radius)] border
      text-[15px] text-ink bg-surface
      focus:outline-none focus:border-ink-3
      transition-colors duration-[var(--dur-fast)]
      placeholder:text-ink-3
      ${
        err
          ? "border-negative"
          : "border-line"
      }
    `;

    const filteredCategories = categories.filter(
      (category) => category.kind === form.kind
    );

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
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              px-5 min-h-[44px] rounded-[var(--radius)]
              border border-line
              text-sm font-medium text-ink-2
              hover:text-ink hover:border-ink-3
              transition-colors duration-[var(--dur-fast)]
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="
              px-5 min-h-[44px] rounded-[var(--radius)]
              text-sm font-medium text-accent-ink bg-accent
              transition-opacity duration-[var(--dur-fast)]
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            {saving ? "Salvando..." : submitLabel}
          </button>
        </>
      }
    >

          {/* Tipo + Valor */}
          <div className="grid grid-cols-2 gap-4">

            <div>

              <label className="text-sm text-ink-2 block mb-1.5">
                Tipo
              </label>

              <div className="flex gap-2">

                {(
                  [
                    "EXPENSE",
                    "INCOME",
                  ] as const
                ).map((t) => (

                  <button
                    type="button"
                    key={t}
                    disabled={isEdit}
                    onClick={() =>
                    setForm((f) => {
                      const currentCategory = categories.find(
                        (category) => category.id === f.categoryId
                      );

                      const categoryBelongsToKind =
                        currentCategory?.kind === t;

                      return {
                        ...f,
                        kind: t,
                        categoryId: categoryBelongsToKind
                          ? f.categoryId
                          : "",
                      };
                    })
                  }
                    className={`
                      flex-1 py-2 px-3 rounded-[var(--radius)] min-h-[44px]
                      text-sm font-medium border
                      transition-colors duration-[var(--dur-fast)]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${
                        form.kind === t
                          ? t ===
                            "INCOME"
                            ? "bg-ink text-paper border-ink"
                            : "bg-ink text-paper border-ink"
                          : "border-line text-ink-2 hover:text-ink hover:border-ink-3"
                      }
                    `}
                  >
                    {t === "INCOME"
                      ? "↗ Entrada"
                      : "↙ Saída"}
                  </button>
                ))}
              </div>
            </div>

            {/* Valor */}
            <div>

              <label className="text-sm text-ink-2 block mb-1.5">
                Valor
              </label>

              <div
                className={`
                  flex items-center border rounded-[var(--radius)] overflow-hidden
                  transition-colors duration-[var(--dur-fast)]
                  ${
                    errors.amount
                      ? "border-negative"
                      : "border-line focus-within:border-ink-3"
                  }
                `}
              >

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  value={amountInput}
                  onChange={(e) =>
                    handleAmountChange(
                      e.target.value
                    )
                  }
                  className="
                    w-full px-3.5 min-h-[48px]
                    text-[15px] text-ink
                    focus:outline-none bg-surface
                    placeholder:text-ink-3
                  "
                />
              </div>

              {errors.amount && (
                <p className="text-xs text-negative mt-1.5">
                  {errors.amount}
                </p>
              )}
            </div>
          </div>

          {/* Categoria + Data */}
          <div className="grid grid-cols-2 gap-4">

            <div>

              <label className="text-sm text-ink-2 block mb-1.5">
                Categoria
              </label>

              <select
                value={form.categoryId}
                onChange={(e) => {
                  const categoryId = e.target.value;

                  const selectedCategory = categories.find(
                    (category) => category.id === categoryId
                  );

                  setForm((f) => ({
                    ...f,
                    categoryId,
                    ...(selectedCategory && {
                      kind: selectedCategory.kind as "EXPENSE" | "INCOME",
                    }),
                  }));

                  setErrors((e) => ({
                    ...e,
                    categoryId: undefined,
                  }));
                }}
                className={inputClass(
                  errors.categoryId
                )}
              >

                <option value="">
                  {loadingCategories
                    ? "Carregando categorias..."
                    : "Selecione uma categoria"}
                </option>

                {filteredCategories.map((c) => (

                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </option>
                ))}
              </select>

              {errors.categoryId && (
                <p className="text-xs text-negative mt-1.5">
                  {errors.categoryId}
                </p>
              )}
            </div>

            <div>

              <label className="text-sm text-ink-2 block mb-1.5">
                Data
              </label>

              <input
                type="date"
                value={form.occurredAt}
                onChange={(e) =>
                  field(
                    "occurredAt",
                    e.target.value
                  )
                }
                className={inputClass()}
              />
            </div>
          </div>

          {/* Forma de pagamento */}
          <div>

            <label className="text-sm text-ink-2 block mb-1.5">
              Forma de Pagamento
            </label>

            <select
              value={form.paymentMethod}
              onChange={(e) =>
                field(
                  "paymentMethod",
                  e.target.value
                )
              }
              className={inputClass(
                errors.paymentMethod
              )}
            >

              <option value="">
                Selecione a forma de pagamento
              </option>

              {PaymentMethods.map((p) => (

                <option
                  key={p.value}
                  value={p.value}
                >
                  {p.label}
                </option>
              ))}
            </select>

            {errors.paymentMethod && (
              <p className="text-xs text-negative mt-1.5">
                {errors.paymentMethod}
              </p>
            )}
          </div>

          {/* Nome */}
          <div>

            <label className="text-sm text-ink-2 block mb-1.5">
              Nome
            </label>

            <input
              type="text"
              placeholder="Ex.: Salário, Mercado, Netflix..."
              value={form.description}
              onChange={(e) =>
                field(
                  "description",
                  e.target.value
                )
              }
              className={inputClass(
                errors.description
              )}
            />

            {errors.description && (
              <p className="text-xs text-negative mt-1.5">
                {errors.description}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div>

            <label className="text-sm text-ink-2 block mb-1.5">
              Descrição{" "}

              <span className="text-ink-3 font-normal">
                (opcional)
              </span>
            </label>

            <textarea
              placeholder="Adicione uma observação..."
              value={form.observation}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  observation:
                    e.target.value,
                }))
              }
              rows={3}
              className="
                w-full px-3.5 py-2.5 rounded-[var(--radius)] border border-line
                text-[15px] text-ink resize-none bg-surface
                focus:outline-none focus:border-ink-3
                transition-colors duration-[var(--dur-fast)]
              "
            />
          </div>

          {/* Recorrente */}
          <div className="border border-line rounded-[var(--radius)]">

            <button
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  recurring:
                    !f.recurring,
                }))
              }
              className="
                w-full flex items-center justify-between
                px-4 py-3
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className={`
                    relative w-10 h-5 rounded-full
                    transition-colors duration-[var(--dur-fast)] shrink-0
                    ${
                      form.recurring
                        ? "bg-ink"
                        : "bg-line"
                    }
                  `}
                >
                  <span
                    className={`
                      absolute top-0.5 left-0.5
                      w-4 h-4 bg-white rounded-full
                      transition-transform duration-[var(--dur-fast)]
                      ${
                        form.recurring
                          ? "translate-x-5"
                          : "translate-x-0"
                      }
                    `}
                  />
                </div>

                <div className="text-left">

                  <p className="text-sm text-ink">
                    Transação recorrente
                  </p>

                  <p className="text-xs text-ink-3">
                    Repete esta transação automaticamente
                  </p>
                </div>
              </div>

              <span className="text-ink-3 text-xs" aria-hidden>
                ▾
              </span>
            </button>
          </div>

          {serverError && (
            <FormAlert>{serverError}</FormAlert>
          )}

    </AppDialog>
  );
}