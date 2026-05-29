"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { api } from "@/services/api";
import { formatCurrency } from "@/app/utils/Formatters";

type TransactionModalProps = {
  onClose: () => void;
  onSave: (transaction: TransactionFormData) => void;
};

export type TransactionFormData = {
  accountId: string;
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

const AccountId =
  localStorage.getItem(
    "accountId"
  ) ?? "";

export default function TransactionModal({
  onClose,
  onSave,
}: TransactionModalProps) {

  const [categories, setCategories] =
    useState<CategoriesSelect[]>([]);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [amountInput, setAmountInput] =
    useState("");

  const [form, setForm] =
    useState<TransactionFormData>({
      accountId: AccountId,
      categoryId: "",
      kind: "INCOME",
      amount: 0,
      description: "",
      occurredAt: TODAY,
      paymentMethod: "",
      observation: "",
      recurring: false,
    });

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

        const response = await api(
          "/categories/getCategoriesSelect"
        );

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

  function handleSave() {

    const e = validate();

    if (
      Object.keys(e).length > 0
    ) {
      setErrors(e);
      return;
    }

    onSave(form);
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
      w-full px-3 py-2 rounded-lg border
      text-sm text-gray-800 bg-white
      focus:outline-none focus:ring-2
      transition-all duration-200
      ${
        err
          ? "border-red-400 focus:ring-red-200"
          : "border-gray-200 focus:ring-(--color-interactive)/30"
      }
    `;

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">

          <div>

            <h2 className="text-lg font-semibold text-gray-900">
              Nova Transação
            </h2>

            <p className="text-sm text-gray-400 mt-0.5">
              Preencha os dados abaixo
              para criar uma nova
              transação.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              p-1.5 rounded-lg
              hover:bg-gray-100
              transition-all duration-200
              text-gray-400 hover:text-gray-600
              focus:outline-none focus:ring-2 focus:ring-gray-200
            "
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">

          {/* Tipo + Valor */}
          <div className="grid grid-cols-2 gap-4">

            <div>

              <label className="text-sm font-medium text-gray-700 block mb-1.5">
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
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        kind: t,
                      }))
                    }
                    className={`
                      flex-1 py-2 px-3 rounded-lg
                      text-sm font-medium border
                      transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-offset-1
                      ${
                        form.kind === t
                          ? t ===
                            "INCOME"
                            ? "bg-green-50 border-green-300 text-green-600 focus:ring-green-200"
                            : "bg-red-50 border-red-300 text-red-600 focus:ring-red-200"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300"
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

              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Valor
              </label>

              <div
                className={`
                  flex items-center border rounded-lg overflow-hidden
                  transition-all duration-200
                  ${
                    errors.amount
                      ? "border-red-400"
                      : "border-gray-200 focus-within:ring-2 focus-within:ring-(--color-interactive)/30"
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
                    w-full px-3 py-2
                    text-sm text-gray-800
                    focus:outline-none bg-white
                  "
                />
              </div>

              {errors.amount && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.amount}
                </p>
              )}
            </div>
          </div>

          {/* Categoria + Data */}
          <div className="grid grid-cols-2 gap-4">

            <div>

              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Categoria
              </label>

              <select
                value={form.categoryId}
                onChange={(e) =>
                  field(
                    "categoryId",
                    e.target.value
                  )
                }
                className={inputClass(
                  errors.categoryId
                )}
              >

                <option value="">
                  {loadingCategories
                    ? "Carregando categorias..."
                    : "Selecione uma categoria"}
                </option>

                {categories.map((c) => (

                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </option>
                ))}
              </select>

              {errors.categoryId && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.categoryId}
                </p>
              )}
            </div>

            <div>

              <label className="text-sm font-medium text-gray-700 block mb-1.5">
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

            <label className="text-sm font-medium text-gray-700 block mb-1.5">
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
              <p className="text-xs text-red-500 mt-1">
                {errors.paymentMethod}
              </p>
            )}
          </div>

          {/* Nome */}
          <div>

            <label className="text-sm font-medium text-gray-700 block mb-1.5">
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
              <p className="text-xs text-red-500 mt-1">
                {errors.description}
              </p>
            )}
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
                w-full px-3 py-2 rounded-lg border border-gray-200
                text-sm text-gray-800 resize-none
                focus:outline-none focus:ring-2
                focus:ring-(--color-interactive)/30
                transition-all duration-200
              "
            />
          </div>

          {/* Recorrente */}
          <div className="border border-gray-200 rounded-xl">

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
                    transition-colors duration-200 shrink-0
                    ${
                      form.recurring
                        ? "bg-[var(--color-interactive)]"
                        : "bg-gray-300"
                    }
                  `}
                >
                  <span
                    className={`
                      absolute top-0.5 left-0.5
                      w-4 h-4 bg-white rounded-full shadow
                      transition-transform duration-200
                      ${
                        form.recurring
                          ? "translate-x-5"
                          : "translate-x-0"
                      }
                    `}
                  />
                </div>

                <div className="text-left">

                  <p className="text-sm font-medium text-gray-800">
                    Transação recorrente
                  </p>

                  <p className="text-xs text-gray-400">
                    Repete esta transação automaticamente
                  </p>
                </div>
              </div>

              <span className="text-gray-400 text-xs">
                ▾
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">

          <button
            type="button"
            onClick={onClose}
            className="
              px-5 py-2 rounded-lg
              border border-gray-200
              text-sm font-medium text-gray-600
              hover:bg-gray-100 hover:border-gray-300
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-gray-200
            "
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="
              px-5 py-2 rounded-lg
              text-sm font-semibold text-white
              transition-all duration-200
              hover:brightness-110
              active:scale-[0.98]
              focus:outline-none focus:ring-2 focus:ring-offset-1
            "
            style={{
              backgroundColor:
                "var(--color-interactive)",
            }}
          >
            Salvar Transação
          </button>
        </div>
      </div>
    </div>
  );
}