import { api } from "./api";
import { getJson } from "@/app/utils/http";
import { PageResponse } from "./types";

// ─── tipos compartilhados com a página ─────────────────────────

export type Transaction = {
  id: string;
  amount: number;
  title: string;
  category: string | null;
  categoryColor: string | null;
  subtitle: string | null;
  kind: "EXPENSE" | "INCOME";
  date: string;
  paymentMethod: string;
  dateLabel: string;
  accountName: string;
};

export type TransactionDetails = {
  id: string;
  description: string;
  observation: string | null;
  amount: number;
  kind: "EXPENSE" | "INCOME";
  categoryId: string | null;
  categoryName: string | null;
  paymentMethod: string;
  occurredAt: string;
  recurring: boolean;
  accountName: string;
};

function json(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

export function listTransactions(): Promise<Response> {
  return api("/transactions/list");
}

export function fetchTransactions(): Promise<Transaction[]> {
  return getJson<PageResponse<Transaction>>(listTransactions()).then(
    (data) => data.content
  );
}

export function getTransaction(id: string): Promise<Response> {
  return api(`/transactions/${id}`);
}

export function fetchTransaction(id: string): Promise<TransactionDetails> {
  return getJson<TransactionDetails>(getTransaction(id));
}

export function createTransaction(
  data: Record<string, unknown>,
  idempotencyKey?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  return api("/transactions/create", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
}

export function updateTransaction(
  id: string,
  data: Record<string, unknown>
): Promise<Response> {
  return api(`/transactions/${id}`, json("PATCH", data));
}

export function deleteTransaction(id: string): Promise<Response> {
  return api(`/transactions/${id}`, { method: "DELETE" });
}
