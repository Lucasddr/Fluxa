"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
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
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

import TransactionModal, {
  type TransactionFormData,
} from "@/app/components/modals/TransactionModal";

import MenuListModal from "@/app/components/modals/MenuListmodal";

import AppDialog from "@/app/components/ui/Dialog";
import DetailRow from "@/app/components/ui/DetailRow";
import FormAlert from "@/app/components/ui/FormAlert";
import Skeleton from "@/app/components/ui/Skeleton";

import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  updateTransaction,
} from "@/services/transactions";
import { useToast } from "@/app/components/ui/Toaster";
import { formatCurrency, formatPaymentMethod } from "@/app/utils/Formatters";
import { friendlyHttpError, HttpError } from "@/app/utils/http";

// ─── tipos ────────────────────────────────────────────────────────────────────

type Transaction = {
  id: string;
  amount: number;
  title: string;
  category: string | null;
  categoryColor: string | null;
  subtitle: string;
  kind: "EXPENSE" | "INCOME";
  date: string;
  paymentMethod: string;
  dateLabel: string;
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

type TransactionDetails = {
  id: string;
  description: string;
  observation: string | null;
  amount: number;
  kind: "EXPENSE" | "INCOME";
  categoryId: string | null;
  categoryName: string | null;
  paymentMethod: string;
  occurredAt: string;
  recurring: boolean;
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
  fullWidth = false,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`relative min-w-0 ${
        fullWidth ? "w-full sm:w-auto" : ""
      }`}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${
          fullWidth ? "w-full sm:w-auto" : ""
        } appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-(--color-interactive)/30 cursor-pointer`}
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
  name: string | null;
  color: string | null;
}) {
  const safeColor = color ?? "#9CA3AF";
  const safeName = name ?? "Sem categoria";

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
      style={{
        backgroundColor: safeColor + "18",
        color: safeColor,
        borderColor: safeColor + "40",
      }}
    >
      {safeName}
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

  const { toast } = useToast();

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

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [detailsTx, setDetailsTx] =
    useState<TransactionDetails | null>(null);

  const [detailsError, setDetailsError] =
    useState<string | null>(null);

  const [editingTx, setEditingTx] =
    useState<TransactionDetails | null>(null);

  const [deletingTx, setDeletingTx] =
    useState<{ id: string; title: string; amount: number } | null>(null);

  const [deleting, setDeleting] = useState(false);

  const [deleteError, setDeleteError] =
    useState<string | null>(null);

  // ─── fetch ────────────────────────────────────────────────────────────────

  async function fetchTransactions() {

    try {

      setLoading(true);

      const response = await listTransactions();

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

    const res = await createTransaction(data);

    if (!res.ok) {
      throw new HttpError(res.status);
    }

    await fetchTransactions();

    setModalOpen(false);
    toast("Transação criada com sucesso.");
  }

  async function fetchTransactionDetails(
    id: string
  ): Promise<TransactionDetails | null> {

    try {

      const res = await getTransaction(id);

      if (!res.ok) {
        console.error(
          "Erro ao buscar transação:",
          res.status
        );

        return null;
      }

      return (await res.json()) as TransactionDetails;

    } catch (error) {

      console.error(
        "Erro ao buscar transação:",
        error
      );

      return null;
    }
  }

  async function handleOpenDetails(id: string) {

    setDetailsTx(null);
    setDetailsError(null);
    setDetailsOpen(true);

    const data = await fetchTransactionDetails(id);

    if (!data) {
      setDetailsError(
        "Não foi possível carregar os detalhes. Tente novamente."
      );

      return;
    }

    setDetailsTx(data);
  }

  async function handleOpenEdit(id: string) {

    const data = await fetchTransactionDetails(id);

    if (data) {
      setEditingTx(data);
    }
  }

  async function handleUpdateTransaction(
    id: string,
    form: TransactionFormData
  ) {

    const res = await updateTransaction(id, {
      categoryId: form.categoryId,
      amount: form.amount,
      description: form.description,
      occurredAt: form.occurredAt,
      observation: form.observation,
      paymentMethod: form.paymentMethod,
      recurring: form.recurring,
    });

    if (!res.ok) {
      throw new HttpError(res.status);
    }

    await fetchTransactions();

    setEditingTx(null);
    setDetailsTx(null);
    toast("Transação atualizada com sucesso.");
  }

  async function handleDeleteTransaction() {

    if (!deletingTx || deleting) {
      return;
    }

    setDeleteError(null);
    setDeleting(true);

    try {

      const res = await deleteTransaction(
        deletingTx.id
      );

      if (!res.ok) {
        throw new HttpError(res.status);
      }

      await fetchTransactions();

      setDeletingTx(null);
      setDetailsTx(null);
      toast("Transação excluída com sucesso.");

    } catch (error) {

      console.error(
        "Erro ao excluir transação:",
        error
      );

      setDeleteError(
        error instanceof HttpError
          ? friendlyHttpError(error.status)
          : "Não foi possível excluir. Tente novamente."
      );

    } finally {

      setDeleting(false);
    }
  }

  function TxMenu({ tx }: { tx: Transaction }) {
    return (
      <MenuListModal
        trigger={
          <button
            type="button"
            aria-label="Opções da transação"
            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        }
        actions={[
          {
            label: "Ver detalhes",
            icon: Eye,
            onClick: () => {
              handleOpenDetails(tx.id);
            },
          },
          {
            label: "Editar",
            icon: Pencil,
            onClick: () => {
              handleOpenEdit(tx.id);
            },
          },
          {
            label: "Excluir",
            icon: Trash2,
            danger: true,
            onClick: () => {
              setDeleteError(null);
              setDeletingTx({
                id: tx.id,
                title: tx.title,
                amount: tx.amount,
              });
            },
          },
        ]}
      />
    );
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
          fullWidth
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
          fullWidth
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
          fullWidth
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

        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 border-b border-gray-100">

          <div className="min-w-0">

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

          <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">

            <span className="shrink-0">
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

        {/* Cabeçalho (desktop) */}

        <div className="hidden lg:grid grid-cols-[2fr_1.2fr_1fr_1.5fr_1.5fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">

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

          <div
            className="flex flex-col gap-2 px-6 py-4"
            role="status"
            aria-label="Carregando transações"
          >
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>

        ) : paginated.length === 0 ? (

          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Nenhuma transação encontrada.
          </div>

        ) : (

          paginated.map((t) => (

            <Fragment key={t.id}>
            <div
              className="hidden lg:grid grid-cols-[2fr_1.2fr_1fr_1.5fr_1.2fr_1fr_auto] gap-4 px-6 py-4 border-b border-(--color-border)/70 hover:bg-gray-50/60 transition items-center"
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

              <TxMenu tx={t} />
            </div>

            {/* Card mobile */}

            <div className="lg:hidden px-4 py-4 border-b border-(--color-border)/70">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
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

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {t.title}
                    </p>

                    <p className="text-xs text-gray-400 truncate">
                      {t.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-sm font-semibold
                    ${
                      t.kind === "INCOME"
                        ? "text-(--color-positive)"
                        : "text-(--color-alert)"
                    }`}
                  >
                    {t.kind === "EXPENSE" ? "-" : ""}
                    {formatCurrency(t.amount)}
                  </span>

                  <TxMenu tx={t} />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <CategoryBadge
                  name={t.category}
                  color={t.categoryColor}
                />

                <KindBadge kind={t.kind} />

                <span className="text-xs text-gray-400">
                  {t.date}
                </span>

                <span className="text-xs text-gray-400">
                  {formatPaymentMethod(t.paymentMethod)}
                </span>
              </div>
            </div>
            </Fragment>
          ))
        )}

        {/* Paginação */}

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-4 border-t border-gray-100">

          <p className="text-sm text-gray-400 min-w-0">

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

      {/* Modal criar */}

      {modalOpen && (
        <TransactionModal
          title="Nova Transação"
          description="Preencha os dados abaixo para criar uma nova transação."
          submitLabel="Salvar Transação"
          onClose={() =>
            setModalOpen(false)
          }
          onSave={
            handleSaveTransaction
          }
        />
      )}

      {/* Modal editar */}

      {editingTx && (
        <TransactionModal
          mode="edit"
          title="Editar Transação"
          description="Altere os dados abaixo para atualizar a transação."
          submitLabel="Salvar alterações"
          initialData={{
            categoryId: editingTx.categoryId ?? "",
            kind: editingTx.kind,
            amount: editingTx.amount,
            description: editingTx.description,
            occurredAt: editingTx.occurredAt,
            paymentMethod: editingTx.paymentMethod,
            observation: editingTx.observation ?? "",
            recurring: editingTx.recurring,
          }}
          onClose={() =>
            setEditingTx(null)
          }
          onSave={(form) =>
            handleUpdateTransaction(editingTx.id, form)
          }
        />
      )}

      {/* Modal detalhes */}

      {detailsOpen && (
        <AppDialog
          open
          onOpenChange={(next) => {
            if (!next) {
              setDetailsOpen(false);
              setDetailsTx(null);
            }
          }}
          title="Detalhes da transação"
          description={
            detailsTx
              ? detailsTx.description
              : "Carregando dados da transação."
          }
          footer={
            detailsTx ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDetailsOpen(false);
                    setDetailsTx(null);
                  }}
                  className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeletingTx({
                      id: detailsTx.id,
                      title: detailsTx.description,
                      amount: detailsTx.amount,
                    });
                  }}
                  className="px-5 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  Excluir
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingTx(detailsTx);
                    setDetailsOpen(false);
                    setDetailsTx(null);
                  }}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition hover:brightness-110"
                  style={{
                    backgroundColor:
                      "var(--color-interactive)",
                  }}
                >
                  Editar
                </button>
              </>
            ) : undefined
          }
        >
          {detailsError ? (
            <FormAlert>{detailsError}</FormAlert>
          ) : !detailsTx ? (
            <p className="text-sm text-gray-500">
              Carregando...
            </p>
          ) : (
            <>
              <DetailRow
                label="Tipo"
                value={
                  detailsTx.kind === "INCOME"
                    ? "Entrada"
                    : "Saída"
                }
              />

              <DetailRow
                label="Valor"
                value={formatCurrency(detailsTx.amount)}
              />

              <DetailRow
                label="Categoria"
                value={
                  detailsTx.categoryName ??
                  "Sem categoria"
                }
              />

              <DetailRow
                label="Data"
                value={detailsTx.occurredAt
                  .split("-")
                  .reverse()
                  .join("/")}
              />

              <DetailRow
                label="Pagamento"
                value={formatPaymentMethod(
                  detailsTx.paymentMethod
                )}
              />

              <DetailRow
                label="Recorrente"
                value={
                  detailsTx.recurring ? "Sim" : "Não"
                }
              />

              {detailsTx.observation && (
                <DetailRow
                  label="Observação"
                  value={detailsTx.observation}
                />
              )}
            </>
          )}
        </AppDialog>
      )}

      {/* Modal excluir */}

      {deletingTx && (
        <AppDialog
          open
          onOpenChange={(next) => {
            if (!next && !deleting) {
              setDeletingTx(null);
            }
          }}
          title="Excluir transação?"
          description="Esta ação não pode ser desfeita."
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  if (!deleting) {
                    setDeletingTx(null);
                  }
                }}
                disabled={deleting}
                className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDeleteTransaction}
                disabled={deleting}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-700">
            Tem certeza que deseja excluir{" "}
            <strong>
              &quot;{deletingTx.title}&quot;
            </strong>{" "}
            no valor de{" "}
            <strong>
              {formatCurrency(deletingTx.amount)}
            </strong>
            ?
          </p>

          {deleteError && (
            <FormAlert>{deleteError}</FormAlert>
          )}
        </AppDialog>
      )}
    </div>
  );
}