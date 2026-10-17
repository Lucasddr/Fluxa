"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

import ValueCard from "@/app/components/ValueCard";
import InsightCards from "@/app/components/InsightCards";
import GraficoDonut from "@/app/components/GraficoDonut";
import TransactionList from "@/app/components/TransactionList";
import MenuListModal from "@/app/components/modals/MenuListmodal";
import Skeleton from "@/app/components/ui/Skeleton";
import PageHeader from "@/app/components/ui/PageHeader";

import { logout } from "@/services/auth";
import {
  buildDashboard,
  insightCards as fetchInsightCards,
  recentTransactions,
} from "@/services/dashboard";

import { formatCurrency } from "@/app/utils/Formatters";
import { friendlyHttpError, HttpError } from "@/app/utils/http";

// ─── types ─────────────────────────────────────────────────────

type DashboardDTO = {
  user: string;
  accountName: string;
  entry: number;
  expenses: number;
  accountsPayable: number;
  monthlyBalance: number;
};

type Transaction = {
  id: string;
  amount: number;
  title: string;
  kind: "EXPENSE" | "INCOME";
  date: string;
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

type EconomyCardDTO = {
  type: "economy";
  savingsPercentage: number;
  savedAmount: number;
  totalIncome: number;
  goalPercentage: number;
};

type MostExpenseCategoryDTO = {
  type: "most_expense_category";
  categoryName: string;
  totalSpent: number;
  percentageOfExpenses: number;
  suggestedReduction: number;
  savingIfReduced: number;
};

type InstallmentsAmountDTO = {
  type: "installments_amount";
  totalAmount: number;
  hasInstallments: boolean;
};

type InsightCardDTO =
  | EconomyCardDTO
  | MostExpenseCategoryDTO
  | InstallmentsAmountDTO;

// ─── período ───────────────────────────────────────────────────

type PeriodKey = "7d" | "15d" | "30d" | "3m" | "6m";

const PERIODS: { key: PeriodKey; label: string; days: number }[] = [
  { key: "7d", label: "7D", days: 7 },
  { key: "15d", label: "15D", days: 15 },
  { key: "30d", label: "30D", days: 30 },
  { key: "3m", label: "3M", days: 90 },
  { key: "6m", label: "6M", days: 180 },
];

function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ─── página ────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  const [cardsData, setCardsData] = useState<DashboardDTO | null>(null);
  const [transactionList, setTransactionList] =
    useState<PageResponse<Transaction> | null>(null);
  const [insightCards, setInsightCards] = useState<InsightCardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [retryKey, setRetryKey] = useState(0);

  const { start, end } = useMemo(() => {
    const days = PERIODS.find((p) => p.key === period)?.days ?? 30;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (days - 1));

    return {
      start: toISODate(startDate),
      end: toISODate(endDate),
    };
  }, [period]);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      console.error("Houve um erro ao realizar o logout, tente novamente em breve");
    } finally {
      router.push("/login");
    }
  }

  // ─── fetch dashboard ────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setLoadError(null);

        const [
          dashboardResponse,
          transactionResponse,
          insightsResponse,
        ] = await Promise.all([
          buildDashboard(start, end),
          recentTransactions(start, end),
          fetchInsightCards(start, end),
        ]);

        const failed = [
          dashboardResponse,
          transactionResponse,
          insightsResponse,
        ].find((r) => !r.ok);

        if (failed) {
          throw new HttpError(failed.status);
        }

        const dashboardData: DashboardDTO = await dashboardResponse.json();
        const transactionsData: PageResponse<Transaction> =
          await transactionResponse.json();
        const insightsData: InsightCardDTO[] = await insightsResponse.json();

        if (!cancelled) {
          setCardsData(dashboardData);
          setTransactionList(transactionsData);
          setInsightCards(insightsData);
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);

        if (!cancelled) {
          setLoadError(
            error instanceof HttpError
              ? friendlyHttpError(error.status)
              : "Não foi possível carregar o dashboard. Tente novamente."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [start, end, retryKey]);

  // ─── loading / erro ─────────────────────────────────────────

  if (loading && (!cardsData || !transactionList)) {
    return (
      <div
        className="flex flex-col gap-4 w-full"
        role="status"
        aria-label="Carregando dashboard"
      >
        <Skeleton className="h-8 w-56" />

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>

        <Skeleton className="h-[480px]" />
      </div>
    );
  }

  if (loadError && (!cardsData || !transactionList)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-full min-h-[400px]">
        <p role="alert" className="text-sm text-negative">
          {loadError}
        </p>

        <button
          type="button"
          onClick={() => setRetryKey((k) => k + 1)}
          className="px-5 min-h-[44px] rounded-[var(--radius)] text-sm font-medium text-accent-ink bg-accent transition-opacity disabled:opacity-40"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!cardsData || !transactionList) {
    return null;
  }

  // ─── render ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8 w-full">
      <PageHeader
        title={`Olá, ${cardsData.user}`}
        subtitle={cardsData.accountName}
        action={
          <MenuListModal
            trigger={
              <button
                type="button"
                aria-label="Abrir menu do usuário"
                className="flex items-center justify-center w-11 h-11 rounded-[var(--radius)] border border-line text-ink-2 transition-colors duration-[var(--dur-fast)] hover:text-ink hover:border-ink-3"
              >
                <User className="w-[18px] h-[18px]" />
              </button>
            }
            actions={[
              {
                label: "Sair",
                icon: LogOut,
                onClick: () => {
                  handleLogout();
                },
              },
            ]}
          />
        }
      />

      {/* Período + retry */}

      <div className="flex items-center justify-end gap-3">
        {loading && cardsData && (
          <span className="text-xs text-ink-3">
            Atualizando...
          </span>
        )}

        {loadError && cardsData && (
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="text-xs font-medium text-negative hover:underline"
          >
            Falha ao atualizar. Tentar novamente
          </button>
        )}

        <div
          role="group"
          aria-label="Período do dashboard"
          className="inline-flex gap-1 rounded-[var(--radius)] border border-line p-1"
        >
          {PERIODS.map((p) => {
            const active = period === p.key;

            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                aria-pressed={active}
                disabled={loading}
                className={`px-3.5 min-h-[36px] rounded-[calc(var(--radius)-4px)] text-[13px] font-medium transition-colors duration-[var(--dur-fast)] disabled:cursor-wait ${
                  active
                    ? "bg-ink text-paper"
                    : "text-ink-2 hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Números */}

      <section aria-label="Resumo do período">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
          <ValueCard
            title="Saldo do período"
            value={formatCurrency(cardsData.monthlyBalance)}
            tone="ink"
          />

          <ValueCard
            title="Entradas"
            value={formatCurrency(cardsData.entry)}
            tone="positive"
          />

          <ValueCard
            title="Saídas"
            value={formatCurrency(cardsData.expenses)}
            tone="negative"
          />

          <ValueCard
            title="Contas a pagar"
            value={formatCurrency(cardsData.accountsPayable)}
            tone="warn"
          />
        </div>
      </section>

      {/* Conteúdo */}

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 min-h-[480px]">
        {/* gráficos */}

        <div className="flex flex-col gap-10 min-w-0">
          <section aria-label="Distribuição" className="border-t border-line pt-5">
            <GraficoDonut
              entry={cardsData.entry}
              expenses={cardsData.expenses}
              accountsPayable={cardsData.accountsPayable}
            />
          </section>

          <InsightCards cards={insightCards} />
        </div>

        {/* transações */}

        <section aria-label="Últimas transações" className="border-t border-line pt-5 min-w-0">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[15px] font-medium text-ink">
              Últimas transações
            </h2>

            <span className="text-[13px] text-ink-3">
              {transactionList.totalElements} no período
            </span>
          </div>

          <div className="max-h-[440px] overflow-y-auto">
            {transactionList.content.length === 0 ? (
              <p className="py-12 text-center text-sm text-ink-3">
                Nenhuma transação neste período.
              </p>
            ) : (
              <TransactionList data={transactionList.content} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
