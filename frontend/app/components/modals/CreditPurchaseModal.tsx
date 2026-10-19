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
import {
  createCreditPurchase,
  updateCreditPurchase,
} from "@/services/credit-purchases";
import { selectCategories } from "@/services/categories";
import {
  listAccounts,
  responseErrorMessage,
} from "@/services/accounts";
import type { Account } from "@/services/accounts";

// ─── types ─────────────────────────────────────────────────────

type CategoryOption = {
  id: string;
  name: string;
  kind: "EXPENSE" | "INCOME";
};

type ManualRow = {
  amount: string;
  dueDate: string;
};

type CreditPurchaseModalProps = {
  onClose: () => void;
  onSave: () => Promise<void>;
  title: string;
  description: string;
  submitLabel: string;
  mode?: "create" | "edit";
  purchaseId?: string;
  initialData?: {
    title: string;
    merchant: string;
    categoryId: string;
    notes: string;
  };
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addMonthsISO(base: string, months: number) {
  const [y, m, d] = base.split("-").map(Number);
  const date = new Date(y, m - 1 + months, d);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

function splitEqual(total: number, qty: number): string[] {
  const base = Math.floor((total * 100) / qty) / 100;
  const rows: string[] = [];

  for (let i = 0; i < qty; i++) {
    rows.push(base.toFixed(2));
  }

  const sum = base * (qty - 1);
  rows[qty - 1] = (total - sum).toFixed(2);

  return rows;
}

// ─── modal ─────────────────────────────────────────────────────

export default function CreditPurchaseModal({
  onClose,
  onSave,
  title,
  description,
  submitLabel,
  mode = "create",
  purchaseId,
  initialData,
}: CreditPurchaseModalProps) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    merchant: initialData?.merchant ?? "",
    totalAmount: "",
    purchaseDate: todayISO(),
    installmentsQty: "3",
    firstDueDate: todayISO(),
    categoryId: initialData?.categoryId ?? "",
    notes: initialData?.notes ?? "",
    accountId: "",
  });

  const [equalValues, setEqualValues] = useState(true);
  const [manualRows, setManualRows] = useState<ManualRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accountsRetryKey, setAccountsRetryKey] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    selectCategories()
      .then(async (res) => {
        if (!res.ok) {
          return;
        }

        const data: CategoryOption[] = await res.json();

        if (!cancelled) {
          setCategories(data.filter((c) => c.kind === "EXPENSE"));
        }
      })
      .catch(() => {});

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

  const qty = Math.max(1, Math.min(120, Number(form.installmentsQty) || 1));
  const total = Number(form.totalAmount) || 0;

  const manualSum = manualRows.reduce(
    (acc, row) => acc + (Number(row.amount) || 0),
    0
  );

  function syncManualRows(nextQty: number, nextTotal: number, nextFirst: string) {
    const amounts = splitEqual(nextTotal || 0, nextQty);

    setManualRows(
      Array.from({ length: nextQty }, (_, i) => ({
        amount: amounts[i] ?? "0.00",
        dueDate: addMonthsISO(nextFirst || todayISO(), i),
      }))
    );
  }

  function validate() {
    const next: Record<string, string> = {};

    if (!form.title.trim()) {
      next.title = "Título é obrigatório.";
    }

    if (!isEdit) {
      if (!form.accountId) {
        next.accountId = "Selecione a conta onde este compromisso será pago.";
      }

      if (!(total > 0)) {
        next.totalAmount = "Informe um valor maior que zero.";
      }

      if (!(qty >= 1 && qty <= 120)) {
        next.installmentsQty = "Entre 1 e 120 parcelas.";
      }

      if (!form.firstDueDate) {
        next.firstDueDate = "Informe o primeiro vencimento.";
      }

      if (!equalValues) {
        if (manualRows.length !== qty) {
          next.installments = "Ajuste as parcelas à quantidade.";
        } else if (Math.abs(manualSum - total) > 0.009) {
          next.installments = `A soma (R$ ${manualSum.toFixed(2)}) deve ser igual ao total (R$ ${total.toFixed(2)}).`;
        }

        manualRows.forEach((row, i) => {
          if (!(Number(row.amount) > 0)) {
            next[`row-${i}`] = "Valor inválido.";
          }

          if (!row.dueDate) {
            next[`row-${i}`] = "Vencimento inválido.";
          }
        });
      }
    }

    if (!form.categoryId) {
      next.categoryId = "Escolha uma categoria de despesa.";
    }

    return next;
  }

  async function handleSave() {
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setServerError(null);

    try {
      setLoading(true);

      const response = isEdit
        ? await updateCreditPurchase(purchaseId ?? "", {
            title: form.title,
            merchant: form.merchant || null,
            categoryId: form.categoryId,
            notes: form.notes || null,
          })
        : await createCreditPurchase({
            title: form.title,
            merchant: form.merchant || null,
            totalAmount: total,
            purchaseDate: form.purchaseDate,
            installmentsQty: qty,
            firstDueDate: form.firstDueDate,
            categoryId: form.categoryId,
            accountId: form.accountId,
            notes: form.notes || null,
            installments: equalValues
              ? null
              : manualRows.map((row) => ({
                  amount: Number(row.amount),
                  dueDate: row.dueDate,
                })),
          });

      if (!response.ok) {
        if (response.status === 400) {
          const data = await response.json().catch(() => null);
          throw new Error(
            data?.errors?.[0] ?? "Dados inválidos. Confira os campos."
          );
        }

        throw new HttpError(response.status);
      }

      await onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar compra parcelada:", error);

      setServerError(
        error instanceof HttpError
          ? friendlyHttpError(error.status)
          : error instanceof Error
            ? error.message
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
      <div>
        <Label htmlFor="purchase-title">Título</Label>

        <Input
          id="purchase-title"
          type="text"
          placeholder="Ex.: Geladeira"
          value={form.title}
          onChange={(e) =>
            setForm((f) => ({ ...f, title: e.target.value }))
          }
          error={errors.title}
        />
      </div>

      {!isEdit && (
        <div>
          <Label htmlFor="purchase-account">Conta de pagamento</Label>
          <Select
            id="purchase-account"
            value={form.accountId}
            onChange={(event) =>
              setForm((current) => ({ ...current, accountId: event.target.value }))
            }
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="purchase-merchant" optional>
            Estabelecimento
          </Label>

          <Input
            id="purchase-merchant"
            type="text"
            placeholder="Ex.: Loja do centro"
            value={form.merchant}
            onChange={(e) =>
              setForm((f) => ({ ...f, merchant: e.target.value }))
            }
          />
        </div>

        <div>
          <Label htmlFor="purchase-category">Categoria (despesa)</Label>

          <Select
            id="purchase-category"
            value={form.categoryId}
            onChange={(e) =>
              setForm((f) => ({ ...f, categoryId: e.target.value }))
            }
            error={errors.categoryId}
          >
            <option value="">Selecionar...</option>

            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {!isEdit && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchase-total">Valor total (R$)</Label>

              <Input
                id="purchase-total"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                value={form.totalAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, totalAmount: e.target.value }))
                }
                error={errors.totalAmount}
              />
            </div>

            <div>
              <Label htmlFor="purchase-qty">Parcelas (1–120)</Label>

              <Input
                id="purchase-qty"
                type="number"
                min="1"
                max="120"
                value={form.installmentsQty}
                onChange={(e) => {
                  const nextQty = Math.max(
                    1,
                    Math.min(120, Number(e.target.value) || 1)
                  );

                  setForm((f) => ({
                    ...f,
                    installmentsQty: e.target.value,
                  }));

                  if (!equalValues) {
                    syncManualRows(nextQty, total, form.firstDueDate);
                  }
                }}
                error={errors.installmentsQty}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchase-date">Data da compra</Label>

              <Input
                id="purchase-date"
                type="date"
                value={form.purchaseDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, purchaseDate: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="purchase-first-due">Primeiro vencimento</Label>

              <Input
                id="purchase-first-due"
                type="date"
                value={form.firstDueDate}
                onChange={(e) => {
                  setForm((f) => ({ ...f, firstDueDate: e.target.value }));

                  if (!equalValues) {
                    syncManualRows(qty, total, e.target.value);
                  }
                }}
                error={errors.firstDueDate}
              />
            </div>
          </div>

          <div>
            <Label>Valores das parcelas</Label>

            <div className="flex gap-2">
              {(
                [
                  { value: true, label: "Iguais (automático)" },
                  { value: false, label: "Diferentes (manual)" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    setEqualValues(opt.value);

                    if (!opt.value && manualRows.length !== qty) {
                      syncManualRows(qty, total, form.firstDueDate);
                    }
                  }}
                  className={`flex-1 py-2 px-3 rounded-[var(--radius)] text-sm font-medium border transition-colors ${
                    equalValues === opt.value
                      ? "bg-ink text-paper border-ink"
                      : "border-line text-ink-2 hover:text-ink hover:border-ink-3"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {!equalValues ? (
              <div className="mt-3 flex flex-col gap-2 max-h-56 overflow-y-auto">
                {manualRows.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
                  >
                    <span className="text-xs text-ink-2 font-medium">
                      {i + 1}ª
                    </span>

                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={row.amount}
                      onChange={(e) =>
                        setManualRows((rows) =>
                          rows.map((r, j) =>
                            j === i ? { ...r, amount: e.target.value } : r
                          )
                        )
                      }
                      error={errors[`row-${i}`]}
                      aria-label={`Valor da parcela ${i + 1}`}
                    />

                    <Input
                      type="date"
                      value={row.dueDate}
                      onChange={(e) =>
                        setManualRows((rows) =>
                          rows.map((r, j) =>
                            j === i ? { ...r, dueDate: e.target.value } : r
                          )
                        )
                      }
                      aria-label={`Vencimento da parcela ${i + 1}`}
                    />
                  </div>
                ))}

                <p className="text-xs text-ink-3">
                  Soma: R$ {manualSum.toFixed(2)} · Total: R${" "}
                  {total.toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-ink-3 mt-1.5">
                {qty} parcela(s) de ~R${" "}
                {qty > 0 ? (total / qty).toFixed(2) : "0,00"}, vencendo
                mensalmente. Centavos de arredondamento vão para a última.
              </p>
            )}

            {errors.installments && (
              <p className="text-xs text-negative mt-1">
                {errors.installments}
              </p>
            )}
          </div>
        </>
      )}

      <div>
        <Label htmlFor="purchase-notes" optional>
          Observações
        </Label>

        <Textarea
          id="purchase-notes"
          placeholder="Ex.: Garantia de 12 meses"
          value={form.notes}
          onChange={(e) =>
            setForm((f) => ({ ...f, notes: e.target.value }))
          }
          rows={2}
        />
      </div>

      {serverError && <FormAlert>{serverError}</FormAlert>}
    </AppDialog>
  );
}
