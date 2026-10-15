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

export function listCategories(
  page: number,
  size: number
): Promise<Response> {
  return api(`/categories?page=${page}&size=${size}`);
}

export function selectCategories(): Promise<Response> {
  return api("/categories/select");
}

export function createCategory(
  data: Record<string, unknown>
): Promise<Response> {
  return api("/categories/create", json("POST", data));
}

export function updateCategory(
  id: string,
  data: Record<string, unknown>
): Promise<Response> {
  return api(`/categories/${id}`, json("PATCH", data));
}

export function deleteCategory(id: string): Promise<Response> {
  return api(`/categories/${id}`, { method: "DELETE" });
}
