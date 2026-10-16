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

export function listCreditPurchases(
  page: number,
  size: number
): Promise<Response> {
  return api(`/credit-purchases/list?page=${page}&size=${size}`);
}

export function getCreditPurchase(id: string): Promise<Response> {
  return api(`/credit-purchases/${id}`);
}

export function createCreditPurchase(
  data: Record<string, unknown>
): Promise<Response> {
  return api("/credit-purchases/create", json("POST", data));
}

export function updateCreditPurchase(
  id: string,
  data: Record<string, unknown>
): Promise<Response> {
  return api(`/credit-purchases/${id}`, json("PATCH", data));
}

export function deleteCreditPurchase(id: string): Promise<Response> {
  return api(`/credit-purchases/${id}`, { method: "DELETE" });
}

export function listInstallments(
  params: { status?: string; start?: string; end?: string } = {}
): Promise<Response> {
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null && v !== "")
    )
  ).toString();

  return api(query ? `/installments/list?${query}` : "/installments/list");
}

export function getInstallment(id: string): Promise<Response> {
  return api(`/installments/${id}`);
}

export function payInstallment(
  id: string,
  idempotencyKey?: string
): Promise<Response> {
  const headers: Record<string, string> = {};

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  return api(`/installments/${id}/pay`, {
    method: "POST",
    headers,
  });
}

export function updateInstallment(
  id: string,
  data: Record<string, unknown>,
  scope: "ONE" | "FOLLOWING" = "ONE"
): Promise<Response> {
  return api(
    `/installments/${id}?scope=${scope}`,
    json("PATCH", data)
  );
}
