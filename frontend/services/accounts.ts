import { api } from "./api";

export type Account = {
  id: string;
  name: string;
  currency: string;
  isDefault: boolean;
};

export type BalanceTrustStatus =
  | "NOT_RECONCILED"
  | "PENDING_REVIEW"
  | "RECONCILED"
  | "USER_ACCEPTED";

export type BalanceObservationStatus =
  | "PENDING_REVIEW"
  | "RECONCILED"
  | "OBSERVED_ACCEPTED"
  | "LEDGER_ACCEPTED";

export type AccountBalanceSummary = {
  accountId: string;
  accountName: string;
  latestObservationId: string | null;
  currentBalance: number;
  ledgerBalance: number;
  observedBalance: number | null;
  difference: number | null;
  balanceAsOf: string | null;
  recordedAt: string | null;
  status: BalanceTrustStatus;
  pendingReviewCount: number;
};

export type BalanceObservation = {
  id: string;
  accountId: string;
  observedBalance: number;
  ledgerBalance: number;
  difference: number;
  balanceAsOf: string;
  recordedAt: string;
  source: "MANUAL" | "STATEMENT";
  status: BalanceObservationStatus;
  reviewedAt: string | null;
};

export type StatementPreviewRow = {
  rowNumber: number;
  sourceReference: string;
  occurredAt: string;
  description: string;
  signedAmount: number;
  duplicate: boolean;
  suggestedCategoryId: string | null;
};

export type StatementPreview = {
  format: "CSV" | "OFX" | "PDF" | "TEXTO";
  rows: StatementPreviewRow[];
  statementBalance: number | null;
  statementBalanceAsOf: string | null;
};

export type StatementImportResult = {
  importedCount: number;
  duplicateCount: number;
  statementBalanceRecorded: boolean;
  categoryRulesSaved: number;
};

function json(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function listAccounts(): Promise<Response> {
  return api("/accounts");
}

export function listAccountBalanceSummaries(): Promise<Response> {
  return api("/accounts/balances");
}

// ─── fetchers tipados para o react-query ───────────────────────
// Preservam o comportamento antigo: erro de resposta carrega a
// primeira mensagem vinda do servidor (responseErrorMessage).

export async function fetchAccounts(): Promise<Account[]> {
  const response = await listAccounts();

  if (!response.ok) {
    throw new Error(await responseErrorMessage(response));
  }

  return (await response.json()) as Account[];
}

export async function fetchAccountBalanceSummaries(): Promise<
  AccountBalanceSummary[]
> {
  const response = await listAccountBalanceSummaries();

  if (!response.ok) {
    throw new Error(await responseErrorMessage(response));
  }

  return (await response.json()) as AccountBalanceSummary[];
}

export function listBalanceObservations(accountId: string): Promise<Response> {
  return api(`/accounts/${accountId}/balance-observations`);
}

export function createBalanceObservation(
  accountId: string,
  data: { observedBalance: number; balanceAsOf: string }
): Promise<Response> {
  return api(`/accounts/${accountId}/balance-observations`, json("POST", data));
}

export function resolveBalanceObservation(
  accountId: string,
  observationId: string,
  resolution: "USE_OBSERVED_BALANCE" | "USE_REGISTERED_TRANSACTIONS"
): Promise<Response> {
  return api(
    `/accounts/${accountId}/balance-observations/${observationId}/resolve`,
    json("POST", { resolution })
  );
}

export function previewStatementImport(accountId: string, file: File): Promise<Response> {
  const form = new FormData();
  form.append("file", file);
  return api(`/accounts/${accountId}/statement-imports/preview`, {
    method: "POST",
    body: form,
  });
}

export function previewStatementText(accountId: string, text: string): Promise<Response> {
  return api(
    `/accounts/${accountId}/statement-imports/preview-text`,
    json("POST", { text })
  );
}

export function importStatementRows(
  accountId: string,
  transactions: {
    sourceReference: string;
    occurredAt: string;
    signedAmount: number;
    description: string;
    categoryId: string;
    rememberCategoryRule: boolean;
  }[],
  statementBalance: number | null = null,
  statementBalanceAsOf: string | null = null
): Promise<Response> {
  return api(
    `/accounts/${accountId}/statement-imports`,
    json("POST", { transactions, statementBalance, statementBalanceAsOf })
  );
}

export function createAccount(data: { name: string }): Promise<Response> {
  return api("/accounts", json("POST", data));
}

export function updateAccount(
  id: string,
  data: { name: string }
): Promise<Response> {
  return api(`/accounts/${id}`, json("PATCH", data));
}

export function setDefaultAccount(id: string): Promise<Response> {
  return api(`/accounts/${id}/default`, { method: "PUT" });
}

export function deleteAccount(id: string): Promise<Response> {
  return api(`/accounts/${id}`, { method: "DELETE" });
}

export async function responseErrorMessage(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  return body?.errors?.[0] ?? "Não foi possível concluir. Tente novamente.";
}
