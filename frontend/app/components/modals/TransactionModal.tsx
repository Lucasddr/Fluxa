"use client";

import { useEffect, useState } from "react";

import AppDialog from "@/app/components/ui/Dialog";
import FormAlert from "@/app/components/ui/FormAlert";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Label from "@/app/components/ui/Label";
import Select from "@/app/components/ui/Select";
import Textarea from "@/app/components/ui/Textarea";

import { friendlyHttpError, HttpError } from "@/app/utils/http";
import { selectCategories } from "@/services/categories";
import { listAccounts, responseErrorMessage } from "@/services/accounts";
import type { Account } from "@/services/accounts";
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
  accountId: string;
};

type CategoriesSelect = {
  id: string;
  name: string;
  kind: string;
};

const PaymentMethods = [
  { value: "PIX", label: "Pix" },
  { value: "CREDIT", label: "Cartão de Crédito" },
  { value: "DEBIT", label: "Cartão de Débito" },
  { value: "CASH", label: "Dinheiro" },
  { value: "OTHER", label: "Outro" },
];

const TODAY = new Date().toISOString().split("T")[0];

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

  const [categories, setCategories] = useState<CategoriesSelect[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accountsRetryKey, setAccountsRetryKey] = useState(0);

  const [amountInput, setAmountInput] = useState(
    initialData?.amount ? formatCurrency(initialData.amount) : ""
  );

  const [form, setForm] = useState<TransactionFormData>({
    categoryId: initialData?.categoryId ?? "",
    kind: initialData?.kind ?? "INCOME",
    amount: initialData?.amount ?? 0,
    description: initialData?.description ?? "",
    occurredAt: initialData?.occurredAt ?? TODAY,
    paymentMethod: initialData?.paymentMethod ?? "",
    observation: initialData?.observation ?? "",
    recurring: initialData?.recurring ?? false,
    accountId: initialData?.accountId ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof TransactionFormData, string>>
  >({});

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        setLoadingCategories(true);

        const response = await selectCategories();

        if (!response.ok) {
          throw new Error("Erro ao buscar categorias");
        }

        const data: CategoriesSelect[] = await response.json();

        if (!cancelled) {
          setCategories(data);
        }
      } catch (err) {
        console.error("Erro ao carregar categorias:", err);
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    }

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchAccounts() {
      try {
        setAccountsLoading(true);
        setAccountsError(null);
        const response = await listAccounts();
        if (!response.ok) {
          throw new Error(await responseErrorMessage(response));
        }

        const data = (await response.json()) as Account[];
        if (!cancelled) {
          setAccounts(data);
          setForm((current) => ({
            ...current,
            accountId:
              current.accountId ||
              data.find((account) => account.isDefault)?.id ||
              data[0]?.id ||
              "",
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setAccountsError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as contas."
          );
        }
      } finally {
        if (!cancelled) setAccountsLoading(false);
      }
    }

    void fetchAccounts();
    return () => {
      cancelled = true;
    };
  }, [accountsRetryKey]);

  function handleAmountChange(value: string) {
    const digits = value.replace(/\D/g, "");
    const amount = Number(digits) / 100;

    setAmountInput(digits ? formatCurrency(amount) : "");
    setForm((f) => ({ ...f, amount }));
    setErrors((e) => ({ ...e, amount: undefined }));
  }

  function validate() {
    const e: typeof errors = {};

    if (!form.amount || form.amount <= 0) {
      e.amount = "Informe um valor válido";
    }

    if (!form.categoryId) {
      e.categoryId = "Selecione uma categoria";
    }

    if (!isEdit && !form.accountId) {
      e.accountId = "Selecione uma conta";
    }

    if (!form.description.trim()) {
      e.description = "Descrição é obrigatória";
    }

    if (!form.paymentMethod) {
      e.paymentMethod = "Selecione a forma de pagamento";
    }

    return e;
  }

  async function handleSave() {
    const e = validate();

    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setServerError(null);
    setSaving(true);

    try {
      await onSave(form);
    } catch (err) {
      console.error("Erro ao salvar transação:", err);

      setServerError(
        err instanceof HttpError
          ? friendlyHttpError(err.status)
          : "Não foi possível salvar. Tente novamente."
      );
    } finally {
      setSaving(false);
    }
  }

  function field(key: keyof TransactionFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

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
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>

          <Button onClick={handleSave} loading={saving} disabled={saving}>
            {submitLabel}
          </Button>
        </>
      }
    >
      {/* Tipo + Valor */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tipo</Label>

          <div className="flex gap-2">
            {(["EXPENSE", "INCOME"] as const).map((t) => (
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
                      categoryId: categoryBelongsToKind ? f.categoryId : "",
                    };
                  })
                }
                className={`flex-1 py-2 px-3 rounded-[var(--radius)] min-h-[44px] text-sm font-medium border transition-colors duration-[var(--dur-fast)] disabled:opacity-50 disabled:cursor-not-allowed ${
                  form.kind === t
                    ? "bg-ink text-paper border-ink"
                    : "border-line text-ink-2 hover:text-ink hover:border-ink-3"
                }`}
              >
                {t === "INCOME" ? "↗ Entrada" : "↙ Saída"}
              </button>
            ))}
          </div>
        </div>

        {/* Valor */}
        <div>
          <Label htmlFor="transaction-amount">Valor</Label>

          <Input
            id="transaction-amount"
            type="text"
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={amountInput}
            onChange={(e) => handleAmountChange(e.target.value)}
            error={errors.amount}
          />
        </div>
      </div>

      {!isEdit && (
        <div>
          <Label htmlFor="transaction-account">Conta</Label>
          <Select
            id="transaction-account"
            value={form.accountId}
            onChange={(event) => field("accountId", event.target.value)}
            error={errors.accountId}
            disabled={accountsLoading || Boolean(accountsError)}
          >
            <option value="">
              {accountsLoading ? "Carregando contas…" : "Selecione uma conta"}
            </option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}{account.isDefault ? " (padrão)" : ""}
              </option>
            ))}
          </Select>
          {accountsError && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <FormAlert>{accountsError}</FormAlert>
              <Button
                variant="secondary"
                onClick={() => setAccountsRetryKey((key) => key + 1)}
              >
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Categoria + Data */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="transaction-category">Categoria</Label>

          <Select
            id="transaction-category"
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

              setErrors((e) => ({ ...e, categoryId: undefined }));
            }}
            error={errors.categoryId}
          >
            <option value="">
              {loadingCategories
                ? "Carregando categorias..."
                : "Selecione uma categoria"}
            </option>

            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="transaction-date">Data</Label>

          <Input
            id="transaction-date"
            type="date"
            value={form.occurredAt}
            onChange={(e) => field("occurredAt", e.target.value)}
          />
        </div>
      </div>

      {/* Forma de pagamento */}
      <div>
        <Label htmlFor="transaction-payment">Forma de Pagamento</Label>

        <Select
          id="transaction-payment"
          value={form.paymentMethod}
          onChange={(e) => field("paymentMethod", e.target.value)}
          error={errors.paymentMethod}
        >
          <option value="">Selecione a forma de pagamento</option>

          {PaymentMethods.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Nome */}
      <div>
        <Label htmlFor="transaction-description">Nome</Label>

        <Input
          id="transaction-description"
          type="text"
          placeholder="Ex.: Salário, Mercado, Netflix..."
          value={form.description}
          onChange={(e) => field("description", e.target.value)}
          error={errors.description}
        />
      </div>

      {/* Descrição */}
      <div>
        <Label htmlFor="transaction-observation" optional>
          Descrição
        </Label>

        <Textarea
          id="transaction-observation"
          placeholder="Adicione uma observação..."
          value={form.observation}
          onChange={(e) =>
            setForm((f) => ({ ...f, observation: e.target.value }))
          }
          rows={3}
        />
      </div>

      {/* Recorrente */}
      <div className="border border-line rounded-[var(--radius)]">
        <button
          type="button"
          onClick={() =>
            setForm((f) => ({ ...f, recurring: !f.recurring }))
          }
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div
              className={`relative w-10 h-5 rounded-full transition-colors duration-[var(--dur-fast)] shrink-0 ${
                form.recurring ? "bg-ink" : "bg-line"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-[var(--dur-fast)] ${
                  form.recurring ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>

            <div className="text-left">
              <p className="text-sm text-ink">Transação recorrente</p>
              <p className="text-xs text-ink-3">
                Repete esta transação automaticamente
              </p>
            </div>
          </div>
        </button>
      </div>

      {serverError && <FormAlert>{serverError}</FormAlert>}
    </AppDialog>
  );
}
