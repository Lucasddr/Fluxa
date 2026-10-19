"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
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
import PageHeader from "@/app/components/ui/PageHeader";
import Button from "@/app/components/ui/Button";
import FilterSelect from "@/app/components/ui/FilterSelect";
import Pagination from "@/app/components/ui/Pagination";
import TransactionFilters from "./TransactionFilters";
import Badge from "@/app/components/ui/Badge";
import EmptyState from "@/app/components/ui/EmptyState";

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
  subtitle: string | null;
  kind: "EXPENSE" | "INCOME";
  date: string;
  paymentMethod: string;
  dateLabel: string;
  accountName: string;
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
  accountName: string;
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

// ─── badge de tipo ────────────────────────────────────────────────────────────

function KindBadge({ kind }: { kind: "EXPENSE" | "INCOME" }) {
  return (
    <Badge variant={kind === "INCOME" ? "positive" : "negative"}>
      {kind === "INCOME" ? "Entrada" : "Saída"}
    </Badge>
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
  const safeColor = color ?? "var(--ink-3)";
  const safeName = name ?? "Sem categoria";

  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-2">
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
  return kind === "INCOME" ? "Entrada" : "Saída";
}

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── página ──────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todas as categorias");
  const [filterkind, setFilterkind] = useState("Todos os tipos");
  const [filterPayment, setFilterPayment] = useState("ALL");
  const [sortBy, setSortBy] = useState("Mais recentes");

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [createKey, setCreateKey] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTx, setDetailsTx] = useState<TransactionDetails | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [editingTx, setEditingTx] = useState<TransactionDetails | null>(null);

  const [deletingTx, setDeletingTx] =
    useState<{ id: string; title: string; amount: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [retryKey, setRetryKey] = useState(0);

  function openCreateModal() {
    setCreateKey(newIdempotencyKey());
    setModalOpen(true);
  }

  // ─── fetch ────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadTransactions() {
      try {
        setLoading(true);
        setListError(null);

        const response = await listTransactions();

        if (!response.ok) {
          throw new HttpError(response.status);
        }

        const data: PageResponse<Transaction> = await response.json();

        if (!cancelled) {
          setTransactions(data.content);
          setLoaded(true);
        }
      } catch (error) {
        console.error("Erro ao buscar transações:", error);

        const message =
          error instanceof HttpError
            ? friendlyHttpError(error.status)
            : "Não foi possível carregar as transações. Tente novamente.";

        if (!cancelled) {
          setListError(message);
          toast(message, "error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTransactions();

    return () => {
      cancelled = true;
    };
  }, [toast, retryKey]);

  // ─── filtros ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...transactions];

    if (search) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          (t.subtitle ?? "").toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterCategory !== "Todas as categorias") {
      list = list.filter((t) => t.category === filterCategory);
    }

    if (filterkind !== "Todos os tipos") {
      list = list.filter((t) => formatKind(t.kind) === filterkind);
    }

    if (filterPayment !== "ALL") {
      list = list.filter((t) => t.paymentMethod === filterPayment);
    }

    return list;
  }, [transactions, search, filterCategory, filterkind, filterPayment]);

  // ─── ordenação ─────────────────────────────────────────────────────────────

  const sorted = useMemo(() => {
    const list = [...filtered];

    switch (sortBy) {
      case "Mais antigas":
        return list.reverse();

      case "Maior valor":
        return list.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

      case "Menor valor":
        return list.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));

      default:
        return list;
    }
  }, [filtered, sortBy]);

  // ─── paginação ────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));

  const paginated = sorted.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // ─── salvar ───────────────────────────────────────────────────────────────

  async function handleSaveTransaction(data: TransactionFormData) {
    const res = await createTransaction(data, createKey ?? undefined);

    if (!res.ok) {
      throw new HttpError(res.status);
    }

    setRetryKey((k) => k + 1);

    setModalOpen(false);
    toast("Transação criada com sucesso.");
  }

  async function fetchTransactionDetails(
    id: string
  ): Promise<TransactionDetails | null> {
    try {
      const res = await getTransaction(id);

      if (!res.ok) {
        console.error("Erro ao buscar transação:", res.status);
        return null;
      }

      return (await res.json()) as TransactionDetails;
    } catch (error) {
      console.error("Erro ao buscar transação:", error);
      return null;
    }
  }

  async function handleOpenDetails(id: string) {
    setDetailsTx(null);
    setDetailsError(null);
    setDetailsOpen(true);

    const data = await fetchTransactionDetails(id);

    if (!data) {
      setDetailsError("Não foi possível carregar os detalhes. Tente novamente.");
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

    setRetryKey((k) => k + 1);

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
      const res = await deleteTransaction(deletingTx.id);

      if (!res.ok) {
        throw new HttpError(res.status);
      }

      setRetryKey((k) => k + 1);

      setDeletingTx(null);
      setDetailsTx(null);
      toast("Transação excluída com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir transação:", error);

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
      <PageHeader
        title="Transações"
        subtitle={`${sorted.length} ${sorted.length === 1 ? "encontrada" : "encontradas"}`}
        action={
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Nova
          </Button>
        }
      />

      {/* Filtros */}

      <TransactionFilters
        categories={Categories}
        paymentMethods={PaymentMethods}
        search={search}
        category={filterCategory}
        kind={filterkind}
        paymentMethod={filterPayment}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onCategoryChange={(value) => {
          setFilterCategory(value);
          setPage(1);
        }}
        onKindChange={(value) => {
          setFilterkind(value);
          setPage(1);
        }}
        onPaymentMethodChange={(value) => {
          setFilterPayment(value);
          setPage(1);
        }}
      />

      {/* Lista */}

      <section aria-label="Transações" className="border-t border-line">
        <div className="flex items-center justify-between gap-2 py-3">
          <div className="flex items-center gap-2 text-sm text-ink-2 min-w-0">
            <span className="shrink-0 hidden sm:inline">Ordenar</span>

            <FilterSelect value={sortBy} onChange={setSortBy}>
              <option>Mais recentes</option>
              <option>Mais antigas</option>
              <option>Maior valor</option>
              <option>Menor valor</option>
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
            onRetry={() => setRetryKey((k) => k + 1)}
          />
        ) : paginated.length === 0 ? (
          <EmptyState
            title={
              search ||
              filterCategory !== "Todas as categorias" ||
              filterkind !== "Todos os tipos" ||
              filterPayment !== "ALL"
                ? "Nada corresponde aos filtros"
                : "Sem transações ainda"
            }
            description={
              search ||
              filterCategory !== "Todas as categorias" ||
              filterkind !== "Todos os tipos" ||
              filterPayment !== "ALL"
                ? "Tente ajustar os filtros acima."
                : "Crie a primeira transação para começar a acompanhar seus gastos."
            }
            action={
              !search &&
              filterCategory === "Todas as categorias" &&
              filterkind === "Todos os tipos" &&
              filterPayment === "ALL" ? (
                <Button onClick={openCreateModal} size="sm">
                  <Plus className="w-4 h-4" />
                  Nova transação
                </Button>
              ) : undefined
            }
          />
        ) : (
          paginated.map((t) => (
            <Fragment key={t.id}>
              <div className="hidden lg:grid grid-cols-[2fr_1.2fr_1fr_1.5fr_1.2fr_1fr_auto] gap-4 py-3.5 border-b border-line items-center">
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
                    <p className="text-[15px] text-ink truncate">{t.title}</p>
                    <p className="text-xs text-ink-3 truncate">
                      {t.subtitle ?? ""} · {t.accountName}
                    </p>
                  </div>
                </div>

                {/* Categoria */}

                <CategoryBadge name={t.category} color={t.categoryColor} />

                {/* Tipo */}

                <KindBadge kind={t.kind} />

                {/* Data */}

                <div>
                  <p className="text-sm text-ink-2">{t.date}</p>
                  <p className="text-xs text-ink-3">{t.dateLabel}</p>
                </div>

                {/* Pagamento */}

                <span className="text-sm text-ink-2">
                  {formatPaymentMethod(t.paymentMethod)}
                </span>

                {/* Valor */}

                <span
                  className={`text-[15px] tabular-nums ${
                    t.kind === "INCOME" ? "text-positive" : "text-negative"
                  }`}
                >
                  {t.kind === "EXPENSE" ? "-" : "+"}
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
                      <p className="text-[15px] text-ink truncate">{t.title}</p>
                      <p className="text-xs text-ink-3 truncate">
                        {t.subtitle ?? ""} · {t.accountName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-[15px] tabular-nums ${
                        t.kind === "INCOME" ? "text-positive" : "text-negative"
                      }`}
                    >
                      {t.kind === "EXPENSE" ? "-" : "+"}
                      {formatCurrency(t.amount)}
                    </span>

                    <TxMenu tx={t} />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <CategoryBadge name={t.category} color={t.categoryColor} />
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

        <Pagination
          currentPage={page - 1}
          totalPages={totalPages}
          totalItems={sorted.length}
          pageSize={itemsPerPage}
          onPageChange={(nextPage) => setPage(nextPage + 1)}
          onPageSizeChange={(size) => {
            setItemsPerPage(size);
            setPage(1);
          }}
          pageSizeOptions={ITEMS_PER_PAGE_OPTIONS}
        />
      </section>

      {/* Modal criar */}

      {modalOpen && (
        <TransactionModal
          title="Nova Transação"
          description="Preencha os dados abaixo para criar uma nova transação."
          submitLabel="Salvar Transação"
          onClose={() => setModalOpen(false)}
          onSave={handleSaveTransaction}
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
          onClose={() => setEditingTx(null)}
          onSave={(form) => handleUpdateTransaction(editingTx.id, form)}
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
            <p className="text-sm text-ink-3">Carregando...</p>
          ) : (
            <>
              <DetailRow
                label="Tipo"
                value={detailsTx.kind === "INCOME" ? "Entrada" : "Saída"}
              />
              <DetailRow label="Valor" value={formatCurrency(detailsTx.amount)} />
              <DetailRow
                label="Categoria"
                value={detailsTx.categoryName ?? "Sem categoria"}
              />
              <DetailRow label="Conta" value={detailsTx.accountName} />
              <DetailRow
                label="Data"
                value={detailsTx.occurredAt.split("-").reverse().join("/")}
              />
              <DetailRow
                label="Pagamento"
                value={formatPaymentMethod(detailsTx.paymentMethod)}
              />
              <DetailRow
                label="Recorrente"
                value={detailsTx.recurring ? "Sim" : "Não"}
              />
              {detailsTx.observation && (
                <DetailRow label="Observação" value={detailsTx.observation} />
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

          {deleteError && <FormAlert>{deleteError}</FormAlert>}
        </AppDialog>
      )}
    </div>
  );
}
