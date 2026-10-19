"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, LogOut, User } from "lucide-react";

import ValueCard from "@/app/components/ValueCard";
import InsightCards from "@/app/components/InsightCards";
import GraficoDonut from "@/app/components/GraficoDonut";
import TransactionList from "@/app/components/TransactionList";
import MenuListModal from "@/app/components/modals/MenuListmodal";
import Skeleton from "@/app/components/ui/Skeleton";
import PageHeader from "@/app/components/ui/PageHeader";
import Badge from "@/app/components/ui/Badge";

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
  currentBalance: number;
  availableBalance: number;
  forecastDays: number;
  balanceStatus: "NOT_RECONCILED" | "PENDING_REVIEW" | "RECONCILED" | "USER_ACCEPTED";
  balanceDifference: number;
  balanceAsOf: string | null;
  pendingBalanceReviews: number;
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

const FORECAST_HORIZONS = [7, 30, 90] as const;

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
  const [forecastDays, setForecastDays] = useState<(typeof FORECAST_HORIZONS)[number]>(30);
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
          buildDashboard(start, end, forecastDays),
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
  }, [start, end, forecastDays, retryKey]);

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

      <div className="flex flex-col gap-3">
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

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs text-ink-3">Período histórico</p>
            <div
              role="group"
              aria-label="Período histórico do dashboard"
              className="inline-flex max-w-full gap-0.5 rounded-[var(--radius)] border border-line p-1"
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
                    className={`min-h-[44px] min-w-0 flex-1 rounded-[calc(var(--radius)-4px)] px-2 text-[12px] font-medium transition-colors duration-[var(--dur-fast)] disabled:cursor-wait ${
                      active ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs text-ink-3">Projeção de compromissos</p>
            <div
              role="group"
              aria-label="Janela futura de compromissos"
              className="inline-flex gap-1 rounded-[var(--radius)] border border-line p-1"
            >
              {FORECAST_HORIZONS.map((days) => {
                const active = forecastDays === days;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setForecastDays(days)}
                    aria-pressed={active}
                    disabled={loading}
                    className={`min-h-[44px] rounded-[calc(var(--radius)-4px)] px-3 text-[12px] font-medium transition-colors duration-[var(--dur-fast)] disabled:cursor-wait ${
                      active ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"
                    }`}
                  >
                    {days} dias
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <BalanceTrustNotice dashboard={cardsData} />

      {/* Números */}

      <section aria-label="Resumo do período">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-3">
          <ValueCard
            title="Saldo disponível"
            value={formatCurrency(cardsData.availableBalance)}
            tone="ink"
          />

          <ValueCard
            title="Saldo atual"
            value={formatCurrency(cardsData.currentBalance)}
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
            title={`Compromissos (${forecastDays} dias)`}
            value={formatCurrency(cardsData.accountsPayable)}
            tone="warn"
          />

          <ValueCard
            title="Fluxo líquido do período"
            value={formatCurrency(cardsData.monthlyBalance)}
            tone="ink"
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

function BalanceTrustNotice({ dashboard }: { dashboard: DashboardDTO }) {
  if (dashboard.balanceStatus === "RECONCILED") {
    return (
      <div className="flex flex-wrap items-center gap-2 border-l-2 border-positive pl-3 text-sm text-ink-2" role="status">
        <CheckCircle2 className="h-4 w-4 text-positive" aria-hidden="true" />
        <Badge variant="positive">Saldo conferido</Badge>
        {dashboard.balanceAsOf && <span>em {formatBalanceDate(dashboard.balanceAsOf)}</span>}
      </div>
    );
  }

  if (dashboard.balanceStatus === "USER_ACCEPTED") {
    return (
      <div className="flex flex-wrap items-start gap-2 border-l-2 border-ink-3 pl-3 text-sm text-ink-2" role="status">
        <Badge variant="neutral">Base escolhida por você</Badge>
        <span>Os relatórios históricos continuam baseados nas transações registradas.</span>
      </div>
    );
  }

  const pending = dashboard.balanceStatus === "PENDING_REVIEW";
  return (
    <div
      className="flex flex-wrap items-start gap-2 border-l-2 border-warn pl-3 text-sm text-ink-2"
      role={pending ? "alert" : "status"}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">
          {pending
            ? `Revisão pendente${dashboard.pendingBalanceReviews > 1 ? ` (${dashboard.pendingBalanceReviews})` : ""}`
            : "Saldo ainda não conferido"}
        </p>
        <p className="mt-0.5 text-xs text-ink-3">
          Por padrão, o histórico usa as transações registradas. O saldo disponível pode estar incompleto até a conferência.
          {pending && dashboard.pendingBalanceReviews === 1
            ? ` Diferença: ${formatCurrency(dashboard.balanceDifference)}.`
            : pending
              ? " Revise cada conta para ver suas divergências."
              : ""}
        </p>
      </div>
      <Link href="/home/bank-accounts" className="min-h-[44px] inline-flex items-center text-sm font-medium text-ink underline underline-offset-4">
        Conferir saldo
      </Link>
    </div>
  );
}

function formatBalanceDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}
