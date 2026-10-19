import { api } from "./api";

export type Account = {
  id: string;
  name: string;
  currency: string;
  isDefault: boolean;
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
