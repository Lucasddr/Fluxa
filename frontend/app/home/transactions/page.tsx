"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
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
import ErrorState from "@/app/components/ui/ErrorState";
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
        aria-label="Filtro"
        className={`${
          fullWidth ? "w-full sm:w-auto" : ""
        } appearance-none pl-3.5 pr-9 min-h-[44px] text-sm border border-line rounded-[var(--radius)] bg-surface text-ink-2 focus:outline-none focus:border-ink-3 transition-colors cursor-pointer`}
      >
        {children}
      </select>

      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" aria-hidden />
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
    <span
      className={`text-[13px] ${
        kind === "INCOME" ? "text-positive" : "text-negative"
      }`}
    >
      {formatKind(kind)}
    </span>
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
      className="inline-flex items-center gap-1.5 text-[13px] text-ink-2"
    >
      <span
        aria-hidden
        className="inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: safeColor }}
      />
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

  const [loaded, setLoaded] = useState(false);

  const [listError, setListError] =
    useState<string | null>(null);

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

  const [createKey, setCreateKey] =
    useState<string | null>(null);

  function newIdempotencyKey(): string {
    if (
      typeof crypto !== "undefined" &&
      "randomUUID" in crypto
    ) {
      return crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
  }

  function openCreateModal() {
    setCreateKey(newIdempotencyKey());
    setModalOpen(true);
  }

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

  const fetchTransactions = useCallback(async () => {

    try {

      setLoading(true);
      setListError(null);

      const response = await listTransactions();

      if (!response.ok) {
        throw new HttpError(response.status);
      }

      const data:
        PageResponse<Transaction> =
        await response.json();

      setTransactions(data.content);
      setLoaded(true);

    } catch (error) {

      console.error(
        "Erro ao buscar transações:",
        error
      );

      const message =
        error instanceof HttpError
          ? friendlyHttpError(error.status)
          : "Não foi possível carregar as transações. Tente novamente.";

      setListError(message);
      toast(message, "error");

    } finally {

      setLoading(false);
    }
  }, [toast]);

  // ─── load inicial ─────────────────────────────────────────────────────────

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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

    const res = await createTransaction(data, createKey ?? undefined);

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
            className="flex items-center justify-center w-11 h-11 rounded-[var(--radius)] text-ink-3 transition-colors hover:text-ink hover:bg-surface"
          >
            <MoreVertical className="w-[18px] h-[18px]" />
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

      <div className="flex items-start justify-between gap-4">

        <div>
          <h1 className="text-[28px] font-light tracking-tight text-ink">
            Transações
          </h1>

          <p className="text-sm text-ink-3 mt-1">
            {sorted.length} {sorted.length === 1 ? "encontrada" : "encontradas"}
          </p>
        </div>

        <button
          onClick={() =>
            openCreateModal()
          }
          className="flex items-center gap-2 px-4 min-h-[44px] rounded-[var(--radius)] text-sm font-medium text-accent-ink bg-accent transition-opacity disabled:opacity-40 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova
        </button>
      </div>

      {/* Filtros */}

      <div className="flex flex-wrap items-center gap-2.5">

        <div className="relative flex-1 min-w-[180px]">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" aria-hidden />

          <input
            type="search"
            placeholder="Buscar..."
            aria-label="Buscar transações"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full min-h-[44px] pl-9 pr-3 text-sm border border-line rounded-[var(--radius)] bg-surface text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink-3 transition-colors"
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
      </div>

      {/* Lista */}

      <section aria-label="Transações" className="border-t border-line">

        <div className="flex items-center justify-between gap-2 py-3">

          <div className="flex items-center gap-2 text-sm text-ink-2 min-w-0">

            <span className="shrink-0 hidden sm:inline">
              Ordenar
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

        {/* Linhas */}

        {loading ? (

          <div
            className="flex flex-col gap-2 py-2"
            role="status"
            aria-label="Carregando transações"
          >
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>

        ) : listError && !loaded ? (

          <ErrorState
            message={listError}
            onRetry={fetchTransactions}
          />

        ) : paginated.length === 0 ? (

          <div className="py-12 text-center text-sm text-ink-3">
            {search || filterCategory !== "Todas as categorias" || filterkind !== "Todos os tipos" || filterPayment !== "ALL"
              ? "Nada corresponde aos filtros."
              : "Sem transações ainda — crie a primeira acima."}
          </div>

        ) : (

          paginated.map((t) => (

            <Fragment key={t.id}>
            <div
              className="hidden lg:grid grid-cols-[2fr_1.2fr_1fr_1.5fr_1.2fr_1fr_auto] gap-4 py-3.5 border-b border-line items-center"
            >

              {/* Descrição */}

              <div className="flex items-center gap-3 min-w-0">

                <div
                  aria-hidden
                  className="w-9 h-9 rounded-[var(--radius)] flex items-center justify-center shrink-0 bg-surface"
                >
                  {t.kind === "INCOME" ? (
                    <ArrowUpRight className="w-4 h-4 text-positive" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4 text-negative" />
                  )}
                </div>

                <div className="min-w-0">

                  <p className="text-[15px] text-ink truncate">
                    {t.title}
                  </p>

                  <p className="text-xs text-ink-3 truncate">
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

                <p className="text-sm text-ink-2">
                  {t.date}
                </p>

                <p className="text-xs text-ink-3">
                  {t.dateLabel}
                </p>
              </div>

              {/* Pagamento */}

              <span className="text-sm text-ink-2">
                {formatPaymentMethod(t.paymentMethod)}
              </span>

              {/* Valor */}

              <span
                className={`text-[15px] tabular-nums
                ${
                  t.kind === "INCOME"
                    ? "text-positive"
                    : "text-negative"
                }`}
              >
                {t.kind === "EXPENSE"
                  ? "-"
                  : "+"}

                {formatCurrency(t.amount)}
              </span>

              {/* Ações */}

              <TxMenu tx={t} />
            </div>

            {/* Card mobile */}

            <div className="lg:hidden py-3.5 border-b border-line">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    aria-hidden
                    className="w-9 h-9 rounded-[var(--radius)] flex items-center justify-center shrink-0 bg-surface"
                  >
                    {t.kind === "INCOME" ? (
                      <ArrowUpRight className="w-4 h-4 text-positive" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-negative" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[15px] text-ink truncate">
                      {t.title}
                    </p>

                    <p className="text-xs text-ink-3 truncate">
                      {t.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[15px] tabular-nums
                    ${
                      t.kind === "INCOME"
                        ? "text-positive"
                        : "text-negative"
                    }`}
                  >
                    {t.kind === "EXPENSE" ? "-" : "+"}
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

                <span className="text-xs text-ink-3">
                  {t.date} · {formatPaymentMethod(t.paymentMethod)}
                </span>
              </div>
            </div>
            </Fragment>
          ))
        )}

        {/* Paginação */}

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4">

          <p className="text-[13px] text-ink-3 min-w-0">

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

            {sorted.length}
          </p>

          <div className="flex items-center gap-1.5">

            <button
              onClick={() =>
                setPage((p) =>
                  Math.max(1, p - 1)
                )
              }
              disabled={page === 1}
              aria-label="Página anterior"
              className="flex items-center justify-center w-11 h-11 rounded-[var(--radius)] border border-line text-ink-2 transition-colors hover:text-ink hover:border-ink-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from(
              { length: totalPages },
              (_, i) => i + 1
            ).map((p) => (

              <button
                key={p}
                onClick={() => setPage(p)}
                aria-label={`Página ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={`min-w-11 h-11 px-2 rounded-[var(--radius)] text-sm transition-colors
                  ${
                    p === page
                      ? "bg-ink text-paper font-medium"
                      : "text-ink-2 hover:text-ink"
                  }`}
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
              aria-label="Próxima página"
              className="flex items-center justify-center w-11 h-11 rounded-[var(--radius)] border border-line text-ink-2 transition-colors hover:text-ink hover:border-ink-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-[13px] text-ink-3">

            <span>
              Por página
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
      </section>

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
                  className="px-5 min-h-[44px] rounded-[var(--radius)] border border-line text-sm font-medium text-ink-2 transition-colors hover:text-ink hover:border-ink-3"
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
                  className="px-5 min-h-[44px] rounded-[var(--radius)] border border-negative/50 text-sm font-medium text-negative transition-colors hover:bg-negative hover:text-white"
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
                  className="px-5 min-h-[44px] rounded-[var(--radius)] text-sm font-medium text-accent-ink bg-accent transition-opacity disabled:opacity-40"
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
                className="px-5 min-h-[44px] rounded-[var(--radius)] border border-line text-sm font-medium text-ink-2 transition-colors hover:text-ink hover:border-ink-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDeleteTransaction}
                disabled={deleting}
                className="px-5 min-h-[44px] rounded-[var(--radius)] text-sm font-medium text-white bg-negative transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </>
          }
        >
          <p className="text-sm text-ink-2">
            Tem certeza que deseja excluir{" "}
            <strong className="text-ink">
              &quot;{deletingTx.title}&quot;
            </strong>{" "}
            no valor de{" "}
            <strong className="text-ink tabular-nums">
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