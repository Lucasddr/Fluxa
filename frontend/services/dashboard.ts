import { api } from "./api";

export function buildDashboard(
  start: string,
  end: string
): Promise<Response> {
  return api(`/dashboard/buildDashboard?start=${start}&end=${end}`);
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
