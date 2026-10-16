"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import ValueCard from "@/app/components/ValueCard";
import InsightCards from "@/app/components/InsightCards";
import GraficoDonut from "@/app/components/GraficoDonut";
import TransactionList from "@/app/components/TransactionList";
import { useRouter } from "next/navigation";

import {
  ArrowDownLeft,
  Banknote,
  DollarSign,
  User,
  Wallet,
  LogOut,
  AwardIcon,
} from "lucide-react";

import { logout } from "@/services/auth";
import {
  buildDashboard,
  insightCards as fetchInsightCards,
  recentTransactions,
} from "@/services/dashboard";

import { formatCurrency } from "@/app/utils/Formatters";
import { friendlyHttpError, HttpError } from "@/app/utils/http";

import MenuListModal from "@/app/components/modals/MenuListmodal";
import Skeleton from "@/app/components/ui/Skeleton";

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
  savingsPercentage: number;       // ex: 18
  savedAmount: number;             // ex: 2340.00
  totalIncome: number;             // ex: 13000.00
  goalPercentage: number;          // ex: 20
};

type MostExpenseCategoryDTO = {
  type: "most_expense_category";
  categoryName: string;            // ex: "Mercado"
  totalSpent: number;              // ex: 820.00
  percentageOfExpenses: number;    // ex: 40
  suggestedReduction: number;      // ex: 10  (%)
  savingIfReduced: number;        // ex: 82.00
};

type InstallmentsAmountDTO = {
  type: "installments_amount";
  totalAmount: number;             // ex: 0.00
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

  const [cardsData, setCardsData] =
    useState<DashboardDTO | null>(null);

  const [transactionList, setTransactionList] =
    useState<PageResponse<Transaction> | null>(null);

  const [insightCards, setInsightCards] =
  useState<InsightCardDTO[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [period, setPeriod] =
    useState<PeriodKey>("30d");

  const { start, end } = useMemo(() => {
    const days =
      PERIODS.find((p) => p.key === period)?.days ?? 30;

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

  const fetchDashboard =
    useCallback(async () => {

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

        const dashboardData:
          DashboardDTO =
          await dashboardResponse.json();

        const transactionsData:
          PageResponse<Transaction> =
          await transactionResponse.json();

        const insightsData: InsightCardDTO[] =
          await insightsResponse.json();

        setCardsData(dashboardData);

        setTransactionList(transactionsData);

        setInsightCards(insightsData);

      } catch (error) {

        console.error(
          "Erro ao carregar dashboard:",
          error
        );

        setLoadError(
          error instanceof HttpError
            ? friendlyHttpError(error.status)
            : "Não foi possível carregar o dashboard. Tente novamente."
        );

      } finally {

        setLoading(false);
      }

    }, [start, end]);

  // ─── load inicial ───────────────────────────────────────────

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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
      <div className="flex flex-col items-center justify-center gap-3 h-full min-h-[400px]">
        <p
          role="alert"
          className="text-sm text-red-600"
        >
          {loadError}
        </p>

        <button
          type="button"
          onClick={fetchDashboard}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition hover:brightness-110"
          style={{
            backgroundColor:
              "var(--color-interactive)",
          }}
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
    <div className="flex flex-col gap-4 w-full">

      {/* Header */}

      <div className="grid grid-rows-2 gap-1.5 lg:grid-cols-2 h-16 text-black justify-between">

        <div>
          <h2 className="text-2xl">
            Olá, {cardsData.user}!
          </h2>
        </div>

        <div className="flex justify-end gap-2">

          <div className="flex flex-col justify-center rounded-xl border-2 border-(--color-border) px-4 h-10 shadow-lg cursor-pointer">

            <h3 className="text-center text-(--color-text-secondary)">
              {cardsData.accountName} 🟢
            </h3>
          </div>

          <MenuListModal
            trigger={
              <button
                type="button"
                aria-label="Abrir menu do usuário"
                className="relative flex items-center justify-center border-2 border-(--color-border) rounded-full w-12 h-12 shadow-lg cursor-pointer"
              >
                <User className="w-5 h-5" />
              </button>
            }
            actions={[
              {
                label: "Logout",
                icon: LogOut,
                onClick: () => {
                  handleLogout();
                },
              },
            ]}
          />
        </div>
      </div>

      {/* Período + retry */}

      <div className="flex items-center justify-end gap-3">
        {loading && cardsData && (
          <span className="text-xs text-gray-400">
            Atualizando...
          </span>
        )}

        {loadError && cardsData && (
          <button
            type="button"
            onClick={fetchDashboard}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Falha ao atualizar. Tentar novamente
          </button>
        )}

        <div
          role="group"
          aria-label="Período do dashboard"
          className="inline-flex rounded-xl border-2 border-(--color-border) p-1 gap-1 bg-white shadow-sm"
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:cursor-wait ${
                  active
                    ? "text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
                style={
                  active
                    ? {
                        backgroundColor:
                          "var(--color-interactive)",
                      }
                    : undefined
                }
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 ">

        <ValueCard
          title="Saldo do Mês"
          value={formatCurrency(
            cardsData.monthlyBalance
          )}
          icon={
            <Wallet className="text-(--color-neutral-alert)" />
          }
          textColor="text-(--color-neutral-alert)"
          bgColor="bg-(--color-surface)"
          iconBgColor="bg-(--color-neutral-alert)/20"
        />

        <ValueCard
          title="Entradas"
          value={formatCurrency(
            cardsData.entry
          )}
          icon={
            <DollarSign className="text-(--color-positive)" />
          }
          textColor="text-(--color-positive)"
          bgColor="bg-(--color-surface)"
          iconBgColor="bg-(--color-positive)/20"
        />

        <ValueCard
          title="Saídas"
          value={formatCurrency(
            cardsData.expenses
          )}
          icon={
            <ArrowDownLeft className="text-(--color-alert)" />
          }
          textColor="text-(--color-alert)"
          bgColor="bg-(--color-surface)"
          iconBgColor="bg-(--color-alert)/20"
        />

        <ValueCard
          title="Contas a Pagar"
          value={formatCurrency(
            cardsData.accountsPayable
          )}
          icon={
            <Banknote className="text-(--color-middle-alert)" />
          }
          textColor="text-(--color-middle-alert)"
          bgColor="bg-(--color-surface)"
          iconBgColor="bg-(--color-middle-alert)/20"
        />
      </div>

      {/* Conteúdo */}

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 min-h-[480px]">

        {/* gráficos */}

        <div className="grid grid-rows-2 gap-4">

          <div className="border-2 border-(--color-border) rounded-xl shadow-lg">

            <GraficoDonut
              entry={cardsData.entry}
              expenses={cardsData.expenses}
              accountsPayable={
                cardsData.accountsPayable
              }
            />
          </div>

              <InsightCards cards={insightCards} />
        </div>

        {/* transações */}

        <div className="border-2 border-(--color-border) rounded-xl shadow-lg">
            <div className="flex justify-start py-3 px-3 ml-4">

              <span className="text-md text-(--color-text-primary) font-semibold">
                Últimas transações
              </span>
            </div>
          <div className="border-t-2 border-(--color-border) max-h-[440px] overflow-y-auto">

            {transactionList.content.length === 0 ? (
              <p className="px-6 py-12 text-center text-gray-400 text-sm">
                Nenhuma transação neste período.
              </p>
            ) : (
              <TransactionList
                data={transactionList.content}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}