"use client";

import { useCallback, useEffect, useState } from "react";

import ValueCard from "@/app/components/ValueCard";
import Grafico from "@/app/components/Grafico";
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
} from "lucide-react";

import { api } from "@/services/api";

import { formatCurrency } from "@/app/utils/Formatters";

import MenuListModal from "@/app/components/modals/MenuListmodal";

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

// ─── período mockado ───────────────────────────────────────────

const start = "2026-04-01";
const end = "2026-06-30";

// ─── página ────────────────────────────────────────────────────

export default function DashboardPage() {

    const router = useRouter();

  const [cardsData, setCardsData] =
    useState<DashboardDTO | null>(null);

  const [transactionList, setTransactionList] =
    useState<PageResponse<Transaction> | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [openMenu, setOpenMenu] = useState<Boolean>(false);

  const [menuPosition, setMenuPosition] = useState({
  top: 0,
  left: 0,
});

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.push("../login");
};

  const handleOpenMenu = (
  event: React.MouseEvent<HTMLDivElement>,
) => {
  const rect = event.currentTarget.getBoundingClientRect();

  setMenuPosition({
    top: rect.bottom + window.scrollY,
    left: rect.right + window.scrollX - 20,
  });

  setOpenMenu(prev => !prev);
};

  // ─── fetch dashboard ────────────────────────────────────────

  const fetchDashboard =
    useCallback(async () => {

      try {

        setLoading(true);

        const [
          dashboardResponse,
          transactionResponse,
        ] = await Promise.all([
          api(
            `/dashboard/buildDashboard?start=${start}&end=${end}`
          ),
          api("/dashboard/recentTransactions"),
        ]);

        if (
          !dashboardResponse.ok ||
          !transactionResponse.ok
        ) {
          throw new Error(
            "Erro ao carregar dashboard"
          );
        }

        const dashboardData:
          DashboardDTO =
          await dashboardResponse.json();

        const transactionsData:
          PageResponse<Transaction> =
          await transactionResponse.json();

        setCardsData(dashboardData);

        setTransactionList(transactionsData);

      } catch (error) {

        console.error(
          "Erro ao carregar dashboard:",
          error
        );

      } finally {

        setLoading(false);
      }

    }, []);

  // ─── load inicial ───────────────────────────────────────────

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ─── loading ────────────────────────────────────────────────

  if (
    loading ||
    !cardsData ||
    !transactionList
  ) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-gray-400">
        Carregando dashboard...
      </div>
    );
  }

  // ─── render ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Header */}

      <div className="grid grid-cols-2 h-16 text-black justify-between">

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

          <div className="relative flex items-center justify-center border-2 border-(--color-border) rounded-full w-12 h-12 shadow-lg cursor-pointer" onClick={(e) => {
            handleOpenMenu(e)
          }}>

            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Cards */}

      <div className="grid grid-cols-4 gap-2">

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

      <div className="grid grid-cols-[1.2fr_0.8fr] gap-4 min-h-[480px]">

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

          <div className="border-2 border-(--color-border) rounded-xl shadow-lg">

            <Grafico />
          </div>
        </div>

        {/* transações */}

        <div className="border-2 border-(--color-border) rounded-xl shadow-lg">
            <div className="flex justify-start py-3 px-3 ml-4">

              <span className="text-md text-(--color-text-primary) font-semibold">
                Últimas transações
              </span>
            </div>
          <div className="border-t-2 border-(--color-border) max-h-[440px] overflow-y-auto">


            <TransactionList
              data={transactionList.content}
            />

            {openMenu && (
              <div
                className="fixed z-50"
                style={{
                  top: menuPosition.top,
                  left: menuPosition.left,
                }}
              >
                <MenuListModal
                  actions={[
                    {
                      label: "Logout",
                      icon: LogOut,
                      onClick: () => {
                        handleLogout();
                        setOpenMenu(false);
                      },
                    }
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}