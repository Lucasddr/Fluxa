import { api } from "./api";

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

export function getTransaction(id: string): Promise<Response> {
  return api(`/transactions/${id}`);
}

export function createTransaction(
  data: Record<string, unknown>
): Promise<Response> {
  return api("/transactions/create", json("POST", data));
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
