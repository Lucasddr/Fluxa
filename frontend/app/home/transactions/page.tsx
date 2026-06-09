"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreVertical,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

import TransactionModal, {
  type TransactionFormData,
} from "@/app/components/modals/TransactionModal";

import { api } from "@/services/api";
import { formatCurrency, formatPaymentMethod } from "@/app/utils/Formatters";

// ─── tipos ────────────────────────────────────────────────────────────────────

type Transaction = {
  id: string;
  amount: number;
  title: string;
  subtitle: string;
  kind: "EXPENSE" | "INCOME";
  date: string;
  category: string;
  paymentMethod: string;
  dateLabel: string;
  categoryColor: string;
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};



// ─── constantes ───────────────────────────────────────────────────────────────

const Categories = [
  "Todas as categorias",
  "Mercado",
  "Entradas",
  "Alimentação",
  "Entretenimento",
  "Transporte",
  "Trabalho",
  "Moradia",
  "Saúde",
  "Investimentos",
  "Outros",
];

const PaymentMethods = [
  { value: "ALL", label: "Todos os métodos" },
  { value: "PIX", label: "Pix" },
  { value: "CREDIT", label: "Cartão de Crédito" },
  { value: "DEBIT", label: "Cartão de Débito" },
  { value: "CASH", label: "Dinheiro" },
  { value: "OTHER", label: "Outro" },
];

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20];

// ─── select simples ──────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-(--color-interactive)/30 cursor-pointer"
      >
        {children}
      </select>

      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ─── badge de tipo ────────────────────────────────────────────────────────────

function KindBadge({
  kind,
}: {
  kind: "EXPENSE" | "INCOME";
}) {
  return (
    <div
      className={`inline-flex items-center w-8/12 px-2.5 py-1 rounded-full text-center text-xs font-medium
      ${
        kind === "INCOME"
          ? "bg-green-50 text-(--color-positive) border border-green-100"
          : "bg-red-50 text-(--color-alert) border border-red-100"
      }`}
    >
      <p className="w-full">
        {formatKind(kind)}
      </p>
    </div>
  );
}

// ─── badge categoria ─────────────────────────────────────────────────────────

function CategoryBadge({
  name,
  color,
}: {
  name: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
      style={{
        backgroundColor: color + "18",
        color,
        borderColor: color + "40",
      }}
    >
      {name}
    </span>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatKind(kind: string) {
  return kind === "INCOME"
    ? "Entrada"
    : "Saída";
}

// ─── página ──────────────────────────────────────────────────────────────────

export default function TransactionsPage() {

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [filterCategory, setFilterCategory] =
    useState("Todas as categorias");

  const [filterkind, setFilterkind] =
    useState("Todos os tipos");

  const [filterPayment, setFilterPayment] =
  useState("ALL");

  const [sortBy, setSortBy] =
    useState("Mais recentes");

  const [page, setPage] =
    useState(1);

  const [itemsPerPage, setItemsPerPage] =
    useState(10);

  const [modalOpen, setModalOpen] =
    useState(false);

  // ─── fetch ────────────────────────────────────────────────────────────────

  async function fetchTransactions() {

    try {

      setLoading(true);

      const response =
        await api("/transactions/list");

      const data:
        PageResponse<Transaction> =
        await response.json();

      setTransactions(data.content);

    } catch (error) {

      console.error(
        "Erro ao buscar transações:",
        error
      );

    } finally {

      setLoading(false);
    }
  }

  // ─── load inicial ─────────────────────────────────────────────────────────

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ─── filtros ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {

    let list = [...transactions];

    if (search) {

      list = list.filter(
        (t) =>
          t.title
            .toLowerCase()
            .includes(search.toLowerCase()) ||

          t.subtitle
            .toLowerCase()
            .includes(search.toLowerCase())
      );
    }

    if (
      filterCategory !==
      "Todas as categorias"
    ) {

      list = list.filter(
        (t) =>
          t.category === filterCategory
      );
    }

    if (
      filterkind !==
      "Todos os tipos"
    ) {

      list = list.filter(
        (t) =>
          formatKind(t.kind) === filterkind
      );
    }

    if (filterPayment !== "ALL") {

      list = list.filter(
        (t) =>
          t.paymentMethod === filterPayment
      );
    }

    return list;

  }, [
    transactions,
    search,
    filterCategory,
    filterkind,
    filterPayment,
  ]);

  // ─── ordenação ─────────────────────────────────────────────────────────────

  const sorted = useMemo(() => {

    const list = [...filtered];

    switch (sortBy) {

      case "Mais antigas":
        return list.reverse();

      case "Maior valor":
        return list.sort(
          (a, b) =>
            Math.abs(b.amount) -
            Math.abs(a.amount)
        );

      case "Menor valor":
        return list.sort(
          (a, b) =>
            Math.abs(a.amount) -
            Math.abs(b.amount)
        );

      default:
        return list;
    }

  }, [filtered, sortBy]);

  // ─── paginação ────────────────────────────────────────────────────────────

  const totalPages = Math.max(
    1,
    Math.ceil(
      sorted.length /
      itemsPerPage
    )
  );

  const paginated = sorted.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // ─── salvar ───────────────────────────────────────────────────────────────

  async function handleSaveTransaction(
    data: TransactionFormData
  ) {

    try {

      await api(
        "/transactions/create",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(data),
        }
      );

      await fetchTransactions();

      setModalOpen(false);

    } catch (error) {

      console.error(
        "Erro ao salvar transação:",
        error
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Transações
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            Veja e gerencie todas as suas transações.
          </p>
        </div>

        <button
          onClick={() =>
            setModalOpen(true)
          }
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition"
          style={{
            backgroundColor:
              "var(--color-interactive)",
          }}
        >
          <Plus className="w-4 h-4" />
          Nova Transação
        </button>
      </div>

      {/* Filtros */}

      <div className="bg-white border border-(--color-border) rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">

        <div className="relative flex-1 min-w-[200px]">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            type="text"
            placeholder="Buscar transações..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-(--color-interactive)/30"
          />
        </div>

        <FilterSelect
          value={filterCategory}
          onChange={(v) => {
            setFilterCategory(v);
            setPage(1);
          }}
        >
          {Categories.map((c) => (
            <option key={c}>
              {c}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filterkind}
          onChange={(v) => {
            setFilterkind(v);
            setPage(1);
          }}
        >
          <option>
            Todos os tipos
          </option>

          <option>
            Entrada
          </option>

          <option>
            Saída
          </option>
        </FilterSelect>

        <FilterSelect
          value={filterPayment}
          onChange={(v) => {
            setFilterPayment(v);
            setPage(1);
          }}
        >
          {PaymentMethods.map((p) => (
            <option
              key={p.value}
              value={p.value}
            >
              {p.label}
            </option>
          ))}
        </FilterSelect>

        <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition ml-auto">

          <SlidersHorizontal className="w-4 h-4" />

          Filtros
        </button>
      </div>

      {/* Tabela */}

      <div className="bg-white border border-(--color-border) rounded-2xl shadow-sm overflow-hidden">

        {/* Topo */}

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">

          <div>

            <h2 className="text-base font-semibold text-gray-900">
              Lista de Transações
            </h2>

            <p className="text-sm mt-0.5">

              <span className="text-(--color-interactive) font-semibold">
                {sorted.length}
              </span>

              <span className="text-gray-400">
                {" "}transações encontradas
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">

            <span>
              Ordenar por:
            </span>

            <FilterSelect
              value={sortBy}
              onChange={setSortBy}
            >
              <option>
                Mais recentes
              </option>

              <option>
                Mais antigas
              </option>

              <option>
                Maior valor
              </option>

              <option>
                Menor valor
              </option>
            </FilterSelect>
          </div>
        </div>

        {/* Cabeçalho */}

        <div className="grid grid-cols-[2fr_1.2fr_1fr_1.5fr_1.5fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">

          <span>Descrição</span>

          <span>Categoria</span>

          <span>Tipo</span>

          <span>Data</span>

          <span>Forma de Pagamento</span>

          <span>Valor</span>

          <span />
        </div>

        {/* Linhas */}

        {loading ? (

          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Carregando transações...
          </div>

        ) : paginated.length === 0 ? (

          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Nenhuma transação encontrada.
          </div>

        ) : (

          paginated.map((t) => (

            <div
              key={t.id}
              className="grid grid-cols-[2fr_1.2fr_1fr_1.5fr_1.2fr_1fr_auto] gap-4 px-6 py-4 border-b border-(--color-border)/70 hover:bg-gray-50/60 transition items-center"
            >

              {/* Descrição */}

              <div className="flex items-center gap-3">

                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                  ${
                    t.kind === "INCOME"
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >
                  {t.kind === "INCOME" ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4 text-red-500" />
                  )}
                </div>

                <div>

                  <p className="text-sm font-semibold text-gray-800">
                    {t.title}
                  </p>

                  <p className="text-xs text-gray-400">
                    {t.subtitle}
                  </p>
                </div>
              </div>

              {/* Categoria */}

              <CategoryBadge
                name={t.category}
                color={t.categoryColor}
              />

              {/* Tipo */}

              <KindBadge kind={t.kind} />

              {/* Data */}

              <div>

                <p className="text-sm text-gray-700">
                  {t.date}
                </p>

                <p className="text-xs text-gray-400">
                  {t.dateLabel}
                </p>
              </div>

              {/* Pagamento */}

              <div className="flex items-center gap-2">

                <span className="text-sm text-gray-600">
                  {formatPaymentMethod(t.paymentMethod)}
                </span>
              </div>

              {/* Valor */}

              <div className="flex items-center gap-1">

                {t.kind === "INCOME" ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-(--color-positive) shrink-0" />
                ) : (
                  <ArrowDownLeft className="w-4 h-4 text-(--color-alert)" />
                )}

                <span
                  className={`text-sm font-semibold
                  ${
                    t.kind === "INCOME"
                      ? "text-(--color-positive)"
                      : "text-(--color-alert)"
                  }`}
                >
                  {t.kind === "EXPENSE"
                    ? "-"
                    : ""}

                  {formatCurrency(t.amount)}
                </span>
              </div>

              {/* Ações */}

              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600">

                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          ))
        )}

        {/* Paginação */}

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">

          <p className="text-sm text-gray-400">

            Mostrando{" "}

            {sorted.length === 0
              ? 0
              : (page - 1) *
                  itemsPerPage +
                1}

            {" "}a{" "}

            {Math.min(
              page * itemsPerPage,
              sorted.length
            )}

            {" "}de{" "}

            {sorted.length} transações
          </p>

          <div className="flex items-center gap-2">

            <button
              onClick={() =>
                setPage((p) =>
                  Math.max(1, p - 1)
                )
              }
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>

            {Array.from(
              { length: totalPages },
              (_, i) => i + 1
            ).map((p) => (

              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition
                  ${
                    p === page
                      ? "text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                style={
                  p === page
                    ? {
                        backgroundColor:
                          "var(--color-interactive)",
                      }
                    : {}
                }
              >
                {p}
              </button>
            ))}
            
            <button
              onClick={() =>
                setPage((p) =>
                  Math.min(
                    totalPages,
                    p + 1
                  )
                )
              }
              disabled={
                page === totalPages
              }
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">

            <span>
              Itens por página:
            </span>

            <FilterSelect
              value={String(itemsPerPage)}
              onChange={(v) => {
                setItemsPerPage(
                  Number(v)
                );

                setPage(1);
              }}
            >
              {ITEMS_PER_PAGE_OPTIONS.map(
                (n) => (
                  <option
                    key={n}
                    value={n}
                  >
                    {n}
                  </option>
                )
              )}
            </FilterSelect>
          </div>
        </div>
      </div>

      {/* Modal */}

      {modalOpen && (
        <TransactionModal
          onClose={() =>
            setModalOpen(false)
          }
          onSave={
            handleSaveTransaction
          }
        />
      )}
    </div>
  );
}