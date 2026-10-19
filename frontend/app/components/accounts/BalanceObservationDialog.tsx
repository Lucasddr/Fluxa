"use client";

import { useEffect, useState } from "react";

import AppDialog from "@/app/components/ui/Dialog";
import Badge from "@/app/components/ui/Badge";
import Button from "@/app/components/ui/Button";
import EmptyState from "@/app/components/ui/EmptyState";
import FormAlert from "@/app/components/ui/FormAlert";
import Input from "@/app/components/ui/Input";
import Label from "@/app/components/ui/Label";
import Skeleton from "@/app/components/ui/Skeleton";
import { formatCurrency } from "@/app/utils/Formatters";
import {
  createBalanceObservation,
  listBalanceObservations,
  resolveBalanceObservation,
  responseErrorMessage,
} from "@/services/accounts";
import type {
  Account,
  AccountBalanceSummary,
  BalanceObservation,
} from "@/services/accounts";

type BalanceObservationDialogProps = {
  account: Account | null;
  summary: AccountBalanceSummary | null;
  onClose: () => void;
  onChanged: () => void;
};

function localToday() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseBrazilianAmount(input: string): number | null {
  const cleaned = input.trim().replace(/R\$\s?/gi, "").replace(/\s/g, "");
  if (!cleaned) return null;

  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : /^-?\d{1,3}(?:\.\d{3})+$/.test(cleaned)
      ? cleaned.replace(/\./g, "")
      : cleaned;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function formatDate(value: string | null) {
  if (!value) return "Data não informada";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function statusLabel(status: BalanceObservation["status"]) {
  switch (status) {
    case "PENDING_REVIEW":
      return "Pendente de revisão";
    case "RECONCILED":
      return "Conferido";
    case "OBSERVED_ACCEPTED":
      return "Saldo informado aceito";
    case "LEDGER_ACCEPTED":
      return "Histórico registrado aceito";
  }
}

export default function BalanceObservationDialog({
  account,
  summary,
  onClose,
  onChanged,
}: BalanceObservationDialogProps) {
  const [observations, setObservations] = useState<BalanceObservation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [retryHistory, setRetryHistory] = useState(0);
  const [amountInput, setAmountInput] = useState("");
  const [balanceAsOf, setBalanceAsOf] = useState(localToday);
  const [amountError, setAmountError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const accountId = account?.id;

  useEffect(() => {
    if (!accountId) return;
    const selectedAccountId = accountId;
    let cancelled = false;

    async function loadHistory() {
      try {
        setHistoryLoading(true);
        setHistoryError(null);
        const response = await listBalanceObservations(selectedAccountId);
        if (!response.ok) {
          throw new Error(await responseErrorMessage(response));
        }

        const data = (await response.json()) as BalanceObservation[];
        if (!cancelled) setObservations(data);
      } catch (error) {
        if (!cancelled) {
          setHistoryError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as conferências de saldo."
          );
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [accountId, retryHistory]);

  const pendingObservations = observations.filter(
    (observation) => observation.status === "PENDING_REVIEW"
  );

  async function refreshAfterMutation() {
    onChanged();
    setRetryHistory((key) => key + 1);
  }

  async function handleSave() {
    if (!account || saving) return;
    const observedBalance = parseBrazilianAmount(amountInput);

    if (observedBalance === null) {
      setAmountError("Informe um saldo válido, por exemplo 1.234,56.");
      return;
    }
    if (!balanceAsOf) {
      setFormError("Informe a data a que esse saldo se refere.");
      return;
    }
    if (balanceAsOf > localToday()) {
      setFormError("A data do saldo não pode estar no futuro.");
      return;
    }

    setSaving(true);
    setAmountError(undefined);
    setFormError(null);
    setSuccessMessage(null);

    try {
      const response = await createBalanceObservation(account.id, {
        observedBalance,
        balanceAsOf,
      });
      if (!response.ok) {
        throw new Error(await responseErrorMessage(response));
      }

      const created = (await response.json()) as BalanceObservation;
      setObservations((current) => [created, ...current]);
      setAmountInput("");
      setSuccessMessage(
        created.status === "PENDING_REVIEW"
          ? "Saldo salvo. Revise a diferença antes de escolher a base operacional."
          : "Saldo conferido e salvo para as operações da conta."
      );
      await refreshAfterMutation();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o saldo. Tente novamente."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve(
    observation: BalanceObservation,
    resolution: "USE_OBSERVED_BALANCE" | "USE_REGISTERED_TRANSACTIONS"
  ) {
    if (!account) return;
    setResolvingId(observation.id);
    setFormError(null);

    try {
      const response = await resolveBalanceObservation(
        account.id,
        observation.id,
        resolution
      );
      if (!response.ok) {
        throw new Error(await responseErrorMessage(response));
      }

      const resolved = (await response.json()) as BalanceObservation;
      setObservations((current) =>
        current.map((item) => item.id === resolved.id ? resolved : item)
      );
      setSuccessMessage(
        resolution === "USE_OBSERVED_BALANCE"
          ? "Saldo informado aceito como base a partir da data escolhida."
          : "As transações registradas foram mantidas como base do histórico."
      );
      await refreshAfterMutation();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar sua decisão. Tente novamente."
      );
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <AppDialog
      open={account !== null}
      onOpenChange={(open) => {
        if (!open && !saving && !resolvingId) onClose();
      }}
      title={`Saldo de ${account?.name ?? "conta"}`}
      description="O valor fica salvo com a data informada e pode servir de referência nas operações."
      footer={
        <Button variant="secondary" onClick={onClose} disabled={saving || resolvingId !== null}>
          Fechar
        </Button>
      }
    >
      {summary && (
        <section aria-labelledby="balance-current-heading" className="border-y border-line py-3">
          <h2 id="balance-current-heading" className="text-sm font-medium text-ink">
            Saldo considerado nas operações
          </h2>
          <p className="mt-1 text-xl tabular-nums text-ink">
            {formatCurrency(summary.currentBalance)}
          </p>
          <p className="mt-1 text-xs text-ink-3">
            {summary.status === "PENDING_REVIEW"
              ? "Revisão pendente. Por padrão, o histórico continua baseado nas transações registradas."
              : summary.status === "NOT_RECONCILED"
                ? "Ainda não conferido. O histórico considera apenas as transações registradas."
                : `Referência mais recente: ${formatDate(summary.balanceAsOf)}.`}
          </p>
        </section>
      )}

      {pendingObservations.length > 0 && (
        <section
          aria-labelledby="balance-review-heading"
          className="flex flex-col gap-3 border border-warn/30 bg-warn-subtle p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="balance-review-heading" className="font-medium text-ink">
              Saldos pendentes de revisão ({pendingObservations.length})
            </h2>
          </div>
          <p className="mt-3 text-xs text-ink-2">
            Escolha a base para as operações futuras. A decisão não cria receita nem despesa e não altera os relatórios históricos.
          </p>
          {pendingObservations.map((observation) => (
            <article key={observation.id} className="border-t border-warn/20 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-ink">
                  Saldo válido em {formatDate(observation.balanceAsOf)}
                </h3>
                <Badge variant="warn">Diferença {formatCurrency(observation.difference)}</Badge>
              </div>
              <dl className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-ink-3">Saldo informado</dt>
                  <dd className="tabular-nums text-ink">
                    {formatCurrency(observation.observedBalance)}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-3">Transações registradas</dt>
                  <dd className="tabular-nums text-ink">
                    {formatCurrency(observation.ledgerBalance)}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-col gap-2">
                <Button
                  onClick={() => void handleResolve(observation, "USE_OBSERVED_BALANCE")}
                  loading={resolvingId === observation.id}
                  disabled={resolvingId !== null}
                >
                  Usar saldo informado como base
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void handleResolve(observation, "USE_REGISTERED_TRANSACTIONS")}
                  disabled={resolvingId !== null}
                >
                  Usar transações registradas
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}

      <section aria-labelledby="balance-entry-heading" className="flex flex-col gap-4">
        <div>
          <h2 id="balance-entry-heading" className="text-base font-medium text-ink">
            Informar saldo observado
          </h2>
          <p className="mt-1 text-sm text-ink-3">
            Registre o saldo exibido no banco ou no extrato e a data a que ele se refere.
          </p>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <div>
            <Label htmlFor="observed-balance">Saldo (R$)</Label>
            <Input
              id="observed-balance"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              required
              placeholder="1.234,56"
              value={amountInput}
              onChange={(event) => {
                setAmountInput(event.target.value);
                setAmountError(undefined);
              }}
              error={amountError}
            />
          </div>
          <div>
            <Label htmlFor="balance-as-of">Saldo válido em</Label>
            <Input
              id="balance-as-of"
              type="date"
              required
              value={balanceAsOf}
              max={localToday()}
              onChange={(event) => setBalanceAsOf(event.target.value)}
            />
          </div>
          <Button type="submit" loading={saving} disabled={saving}>
            Salvar saldo observado
          </Button>
        </form>
        {successMessage && (
          <p className="text-sm text-positive" role="status" aria-live="polite">
            {successMessage}
          </p>
        )}
        {formError && <FormAlert>{formError}</FormAlert>}
      </section>

      <details className="border-t border-line pt-3">
        <summary className="min-h-[44px] cursor-pointer py-2 text-sm font-medium text-ink">
          Histórico de saldos informados ({observations.length})
        </summary>
        {historyLoading ? (
          <div className="flex flex-col gap-2 py-3" role="status" aria-label="Carregando histórico de saldos">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : historyError ? (
          <div className="flex flex-col gap-2 py-3">
            <FormAlert>{historyError}</FormAlert>
            <Button variant="secondary" onClick={() => setRetryHistory((key) => key + 1)}>
              Tentar novamente
            </Button>
          </div>
        ) : observations.length === 0 ? (
          <EmptyState
            title="Nenhuma conferência ainda"
            description="Os saldos informados aparecerão aqui."
          />
        ) : (
          <ol className="divide-y divide-line">
            {observations.map((observation) => (
              <li key={observation.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm tabular-nums text-ink">
                    {formatCurrency(observation.observedBalance)}
                  </p>
                  <p className="text-xs text-ink-3">
                    Válido em {formatDate(observation.balanceAsOf)} · informado {new Date(observation.recordedAt).toLocaleString("pt-BR")}
                  </p>
                  {observation.difference !== 0 && (
                    <p className="text-xs text-ink-3 tabular-nums">
                      Diferença registrada: {formatCurrency(observation.difference)}
                    </p>
                  )}
                </div>
                <Badge variant={observation.status === "PENDING_REVIEW" ? "warn" : "neutral"}>
                  {statusLabel(observation.status)}
                </Badge>
              </li>
            ))}
          </ol>
        )}
      </details>
    </AppDialog>
  );
}
