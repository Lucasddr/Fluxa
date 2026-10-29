import { api } from "./api";
import { getJson } from "@/app/utils/http";
import { PageResponse } from "./types";

// ─── tipos compartilhados com a página ─────────────────────────

export type Category = {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  description: string;
  status: boolean;
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

export function listCategories(
  page: number,
  size: number
): Promise<Response> {
  return api(`/categories?page=${page}&size=${size}`);
}

export function fetchCategories(
  page: number,
  size: number
): Promise<PageResponse<Category>> {
  return getJson<PageResponse<Category>>(listCategories(page, size));
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
