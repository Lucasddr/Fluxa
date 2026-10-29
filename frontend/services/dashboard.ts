import { api } from "./api";
import { HttpError } from "@/app/utils/http";

// ─── tipos compartilhados com a página ─────────────────────────

export type DashboardDTO = {
  user: string;
  accountName: string;
  entry: number;
  expenses: number;
  accountsPayable: number;
  monthlyBalance: number;
  currentBalance: number;
  availableBalance: number;
  forecastDays: number;
  balanceStatus: "NOT_RECONCILED" | "PENDING_REVIEW" | "RECONCILED" | "USER_ACCEPTED";
  balanceDifference: number;
  balanceAsOf: string | null;
  pendingBalanceReviews: number;
};

export type Transaction = {
  id: string;
  amount: number;
  title: string;
  kind: "EXPENSE" | "INCOME";
  date: string;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

export type EconomyCardDTO = {
  type: "economy";
  savingsPercentage: number;
  savedAmount: number;
  totalIncome: number;
  goalPercentage: number;
};

export type MostExpenseCategoryDTO = {
  type: "most_expense_category";
  categoryName: string;
  totalSpent: number;
  percentageOfExpenses: number;
  suggestedReduction: number;
  savingIfReduced: number;
};

export type InstallmentsAmountDTO = {
  type: "installments_amount";
  totalAmount: number;
  hasInstallments: boolean;
};

export type InsightCardDTO =
  | EconomyCardDTO
  | MostExpenseCategoryDTO
  | InstallmentsAmountDTO;

// ─── chamadas cruas (Promise<Response>) ────────────────────────

export function buildDashboard(
  start: string,
  end: string,
  horizonDays = 30
): Promise<Response> {
  return api(
    `/dashboard/buildDashboard?start=${start}&end=${end}&horizonDays=${horizonDays}`
  );
}

export function recentTransactions(
  start: string,
  end: string
): Promise<Response> {
  return api(
    `/dashboard/recentTransactions?start=${start}&end=${end}`
  );
}

export function insightCards(
  start: string,
  end: string
): Promise<Response> {
  return api(`/dashboard/insightCards?start=${start}&end=${end}`);
}

// ─── fetchers tipados para o react-query ───────────────────────
// Usados como queryFn: garantem res.ok e devolvem o JSON já
// convertido, para que o cache do QueryClient guarde dados
// prontos para render (e não uma Response).

async function getJson<T>(pending: Promise<Response>): Promise<T> {
  const res = await pending;

  if (!res.ok) {
    throw new HttpError(res.status);
  }

  return (await res.json()) as T;
}

export function fetchDashboard(
  start: string,
  end: string,
  horizonDays = 30
): Promise<DashboardDTO> {
  return getJson(buildDashboard(start, end, horizonDays));
}

export function fetchRecentTransactions(
  start: string,
  end: string
): Promise<PageResponse<Transaction>> {
  return getJson(recentTransactions(start, end));
}

export function fetchInsightCards(
  start: string,
  end: string
): Promise<InsightCardDTO[]> {
  return getJson(insightCards(start, end));
}
