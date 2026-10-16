"use client";

import { Fragment, useCallback, useEffect, useState } from "react";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  MoreVertical,
  Trash2,
  Eye,
  CreditCard,
  Check,
} from "lucide-react";

import MenuListModal from "@/app/components/modals/MenuListmodal";
import CreditPurchaseModal from "@/app/components/modals/CreditPurchaseModal";
import AppDialog from "@/app/components/ui/Dialog";
import DetailRow from "@/app/components/ui/DetailRow";
import ErrorState from "@/app/components/ui/ErrorState";
import FormAlert from "@/app/components/ui/FormAlert";
import Skeleton from "@/app/components/ui/Skeleton";
import { useToast } from "@/app/components/ui/Toaster";
import { friendlyHttpError, HttpError } from "@/app/utils/http";
import {
  deleteCreditPurchase,
  getCreditPurchase,
  listCreditPurchases,
  payInstallment,
  updateInstallment,
} from "@/services/credit-purchases";

// ─── types ─────────────────────────────────────────────────────

type InstallmentStatus = "PENDING" | "OVERDUE" | "PAID" | "CANCELED";

type Installment = {
  id: string;
  creditPurchaseId: string;
  creditPurchaseTitle: string;
  number: number;
  installmentsQty: number;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
};

type Purchase = {
  id: string;
  title: string;
  merchant: string | null;
  totalAmount: number;
  purchaseDate: string;
  installmentsQty: number;
  firstDueDate: string;
  categoryId: string;
  categoryName: string;
  pendingCount: number;
  paidCount: number;
};

type PurchaseDetails = Purchase & {
  notes: string | null;
  generatedTransactionsCount: number;
  installments: Installment[];
};

type PageResponse<C> = {
  content: C[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);

  if (!y || !m || !d) {
    return iso;
  }

  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

// ─── badges ────────────────────────────────────────────────────

function InstallmentBadge({ status }: { status: InstallmentStatus }) {
  const styles: Record<InstallmentStatus, string> = {
    PENDING: "bg-amber-50 text-amber-600 border border-amber-200",
    OVERDUE: "bg-red-50 text-red-600 border border-red-200",
    PAID: "bg-green-50 text-green-600 border border-green-100",
    CANCELED: "bg-gray-100 text-gray-500 border border-gray-200",
  };

  const labels: Record<InstallmentStatus, string> = {
    PENDING: "Pendente",
    OVERDUE: "Vencida",
    PAID: "Paga",
    CANCELED: "Cancelada",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

// ─── select ────────────────────────────────────────────────────

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
    <div className="relative min-w-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700"
      >
        {children}
      </select>

      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ─── page ──────────────────────────────────────────────────────
export default function ContasPage() {
  const { toast } = useToast();

  const [purchases, setPurchases] =
    useState<PageResponse<Purchase> | null>(null);

  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [details, setDetails] = useState<PurchaseDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [deletingPurchase, setDeletingPurchase] =
    useState<PurchaseDetails | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [payingId, setPayingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [editingInstallment, setEditingInstallment] =
    useState<Installment | null>(null);
  const [installmentForm, setInstallmentForm] = useState({
    amount: "",
    dueDate: "",
    scope: "ONE" as "ONE" | "FOLLOWING",
  });
  const [installmentSaving, setInstallmentSaving] = useState(false);
  const [installmentError, setInstallmentError] = useState<string | null>(null);

  // ─── fetch ───────────────────────────────────────────────────

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setListError(null);

      const response = await listCreditPurchases(page, itemsPerPage);

      if (!response.ok) {
        throw new HttpError(response.status);
      }

      const data: PageResponse<Purchase> = await response.json();

      setPurchases(data);
      setLoaded(true);
    } catch (error) {
      console.error("Erro ao buscar compras parceladas:", error);

      const message =
        error instanceof HttpError
          ? friendlyHttpError(error.status)
          : "Não foi possível carregar as contas. Tente novamente.";

      setListError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, toast]);

  async function openDetails(purchase: Purchase) {
    setDetailsLoading(true);

    try {
      const response = await getCreditPurchase(purchase.id);

      if (!response.ok) {
        throw new HttpError(response.status);
      }

      const data: PurchaseDetails = await response.json();
      setDetails(data);

      if (pendingDeleteId === purchase.id) {
        setPendingDeleteId(null);
        setDeleteError(null);
        setDeletingPurchase(data);
      }
    } catch (error) {
      console.error("Erro ao abrir detalhes:", error);

      toast(
        error instanceof HttpError
          ? friendlyHttpError(error.status)
          : "Não foi possível abrir os detalhes. Tente novamente.",
        "error"
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  async function refreshDetails(purchaseId: string) {
    try {
      const response = await getCreditPurchase(purchaseId);

      if (!response.ok) {
        return;
      }

      const data: PurchaseDetails = await response.json();
      setDetails(data);
    } catch {
      // lista principal já foi atualizada; detalhes ficam como estão
    }
  }

  // ─── pay ─────────────────────────────────────────────────────

  async function handlePay(installment: Installment) {
    if (payingId) {
      return;
    }

    setPayingId(installment.id);

    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${installment.id}`;

      const res = await payInstallment(installment.id, idempotencyKey);

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("Parcela já foi paga.");
        }

        throw new HttpError(res.status);
      }

      toast(
        `Parcela ${installment.number}/${installment.installmentsQty} paga. Virou lançamento no extrato.`
      );

      await fetchPurchases();

      if (details) {
        await refreshDetails(details.id);
      }
    } catch (error) {
      console.error("Erro ao pagar parcela:", error);

      toast(
        error instanceof HttpError
          ? friendlyHttpError(error.status)
          : error instanceof Error
            ? error.message
            : "Não foi possível pagar. Tente novamente.",
        "error"
      );
    } finally {
      setPayingId(null);
    }
  }

  // ─── installment edit ────────────────────────────────────────

  function openEditInstallment(installment: Installment) {
    setInstallmentError(null);
    setInstallmentForm({
      amount: String(installment.amount),
      dueDate: installment.dueDate,
      scope: "ONE",
    });
    setEditingInstallment(installment);
  }

  async function handleSaveInstallment() {
    if (!editingInstallment || installmentSaving) {
      return;
    }

    const scope = installmentForm.scope;
    const payload: Record<string, unknown> = {};

    if (scope === "ONE" && installmentForm.amount) {
      payload.amount = Number(installmentForm.amount);
    }

    if (installmentForm.dueDate) {
      payload.dueDate = installmentForm.dueDate;
    }

    if (Object.keys(payload).length === 0) {
      setInstallmentError("Informe valor e/ou vencimento.");
      return;
    }

    setInstallmentSaving(true);
    setInstallmentError(null);

    try {
      const res = await updateInstallment(
        editingInstallment.id,
        payload,
        scope
      );

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("Parcela já foi paga e não pode ser editada.");
        }

        if (res.status === 400) {
          const data = await res.json().catch(() => null);
          throw new Error(
            data?.errors?.[0] ?? "Dados inválidos para a parcela."
          );
        }

        throw new HttpError(res.status);
      }

      setEditingInstallment(null);
      toast(
        scope === "FOLLOWING"
          ? "Vencimentos atualizados desta em diante."
          : "Parcela atualizada."
      );

      await fetchPurchases();

      if (details) {
        await refreshDetails(details.id);
      }
    } catch (error) {
      console.error("Erro ao editar parcela:", error);

      setInstallmentError(
        error instanceof HttpError
          ? friendlyHttpError(error.status)
          : error instanceof Error
            ? error.message
            : "Não foi possível salvar. Tente novamente."
      );
    } finally {
      setInstallmentSaving(false);
    }
  }

  // ─── delete ──────────────────────────────────────────────────

  async function handleDeletePurchase() {
    if (!deletingPurchase || deleting) {
      return;
    }

    setDeleteError(null);
    setDeleting(true);

    try {
      const res = await deleteCreditPurchase(deletingPurchase.id);

      if (!res.ok) {
        throw new HttpError(res.status);
      }

      await fetchPurchases();

      setDeletingPurchase(null);
      setDetails(null);
      toast("Compra excluída com parcelas e lançamentos.");
    } catch (error) {
      console.error("Erro ao excluir compra:", error);

      setDeleteError(
        error instanceof HttpError
          ? friendlyHttpError(error.status)
          : "Não foi possível excluir. Tente novamente."
      );
    } finally {
      setDeleting(false);
    }
  }

  // ─── effects ─────────────────────────────────────────────────

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  function PurchaseMenu({ purchase }: { purchase: Purchase }) {
    return (
      <MenuListModal
        trigger={
          <button
            type="button"
            aria-label="Abrir opções da conta"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        }
        actions={[
          {
            label: "Ver detalhes",
            icon: Eye,
            onClick: () => {
              openDetails(purchase);
            },
          },
          {
            label: "Editar",
            icon: Pencil,
            onClick: () => {
              setEditingPurchase(purchase);
            },
          },
          {
            label: "Excluir",
            icon: Trash2,
            danger: true,
            onClick: () => {
              setPendingDeleteId(purchase.id);
              openDetails(purchase);
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
          <h1 className="text-3xl font-bold text-gray-900">Contas</h1>

          <p className="text-sm text-gray-400 mt-1">
            Compras parceladas e compromissos futuros.
          </p>
        </div>

        <button
          onClick={() => {
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md"
          style={{
            backgroundColor: "var(--color-interactive)",
          }}
        >
          <Plus className="w-4 h-4" />
          Nova compra parcelada
        </button>
      </div>

      {/* lista */}
      <div className="bg-white border border-(--color-border) rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Compras parceladas
            </h2>

            <p className="text-sm mt-0.5">
              <span className="text-(--color-interactive) font-semibold">
                {purchases?.totalElements ?? 0}
              </span>

              <span className="text-gray-400"> contas encontradas</span>
            </p>
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>Compra</span>
          <span>Total</span>
          <span>Progresso</span>
          <span>Categoria</span>
          <span>Ações</span>
        </div>

        {loading ? (
          <div
            className="flex flex-col gap-2 px-6 py-4"
            role="status"
            aria-label="Carregando contas"
          >
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : listError && !loaded ? (
          <ErrorState message={listError} onRetry={fetchPurchases} />
        ) : purchases?.content.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            Nenhuma compra parcelada. Crie a primeira acima.
          </div>
        ) : (
          purchases?.content.map((purchase) => (
            <Fragment key={purchase.id}>
              <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-(--color-border)/80 hover:bg-gray-50/60 transition items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-teal-50">
                    <CreditCard className="w-4 h-4 text-teal-700" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {purchase.title}
                    </p>

                    {purchase.merchant && (
                      <p className="text-xs text-gray-400">
                        {purchase.merchant}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-sm font-semibold text-gray-800">
                  {formatBRL(purchase.totalAmount)}
                </p>

                <div>
                  <p className="text-xs text-gray-500">
                    {purchase.paidCount}/{purchase.installmentsQty} pagas
                  </p>

                  <div className="h-1.5 mt-1 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-600 transition-all"
                      style={{
                        width: `${
                          purchase.installmentsQty > 0
                            ? (purchase.paidCount /
                                purchase.installmentsQty) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  {purchase.categoryName}
                </p>

                <div className="relative">
                  <PurchaseMenu purchase={purchase} />
                </div>
              </div>

              {/* Card mobile */}
              <div className="lg:hidden px-4 py-4 border-b border-(--color-border)/80">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-teal-50">
                      <CreditCard className="w-4 h-4 text-teal-700" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {purchase.title}
                      </p>

                      <p className="text-xs text-gray-400">
                        {formatBRL(purchase.totalAmount)} ·{" "}
                        {purchase.paidCount}/{purchase.installmentsQty}{" "}
                        pagas
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <PurchaseMenu purchase={purchase} />
                  </div>
                </div>

                <div className="h-1.5 mt-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-600 transition-all"
                    style={{
                      width: `${
                        purchase.installmentsQty > 0
                          ? (purchase.paidCount /
                              purchase.installmentsQty) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </Fragment>
          ))
        )}

        {/* paginação */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            Página {(purchases?.number ?? 0) + 1}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>

            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={page >= (purchases?.totalPages ?? 1) - 1}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Itens:</span>

            <FilterSelect
              value={String(itemsPerPage)}
              onChange={(v) => {
                setItemsPerPage(Number(v));
                setPage(0);
              }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </FilterSelect>
          </div>
        </div>
      </div>

      {/* modal criar */}
      {modalOpen && (
        <CreditPurchaseModal
          title="Nova compra parcelada"
          description="Preencha os dados. As parcelas são geradas automaticamente."
          submitLabel="Salvar compra"
          onClose={() => setModalOpen(false)}
          onSave={async () => {
            setPage(0);
            await fetchPurchases();
            toast("Compra parcelada criada com sucesso.");
          }}
        />
      )}

      {/* modal editar compra */}
      {editingPurchase && (
        <CreditPurchaseModal
          mode="edit"
          purchaseId={editingPurchase.id}
          title="Editar compra"
          description="Título, estabelecimento, categoria e observações."
          submitLabel="Salvar alterações"
          initialData={{
            title: editingPurchase.title,
            merchant: editingPurchase.merchant ?? "",
            categoryId: editingPurchase.categoryId,
            notes: "",
          }}
          onClose={() => setEditingPurchase(null)}
          onSave={async () => {
            await fetchPurchases();

            if (details && details.id === editingPurchase.id) {
              await refreshDetails(details.id);
            }

            toast("Compra atualizada com sucesso.");
          }}
        />
      )}

      {/* modal detalhes */}
      {(details || detailsLoading) && !deletingPurchase && (
        <AppDialog
          open
          onOpenChange={(next) => {
            if (!next) {
              setDetails(null);
            }
          }}
          title="Detalhes da conta"
          description={details?.title ?? "Carregando..."}
          footer={
            details ? (
              <>
                <button
                  type="button"
                  onClick={() => setDetails(null)}
                  className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeletingPurchase(details);
                  }}
                  className="px-5 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  Excluir
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingPurchase({
                      id: details.id,
                      title: details.title,
                      merchant: details.merchant,
                      totalAmount: details.totalAmount,
                      purchaseDate: details.purchaseDate,
                      installmentsQty: details.installmentsQty,
                      firstDueDate: details.firstDueDate,
                      categoryId: details.categoryId,
                      categoryName: details.categoryName,
                      pendingCount: details.pendingCount,
                      paidCount: details.paidCount,
                    });
                    setDetails(null);
                  }}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition hover:brightness-110"
                  style={{
                    backgroundColor: "var(--color-interactive)",
                  }}
                >
                  Editar
                </button>
              </>
            ) : undefined
          }
        >
          {!details ? (
            <div
              className="flex flex-col gap-2"
              role="status"
              aria-label="Carregando detalhes"
            >
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : (
            <>
              <DetailRow label="Total" value={formatBRL(details.totalAmount)} />
              <DetailRow
                label="Estabelecimento"
                value={details.merchant || "—"}
              />
              <DetailRow label="Categoria" value={details.categoryName} />
              <DetailRow
                label="Compra em"
                value={formatDate(details.purchaseDate)}
              />
              <DetailRow
                label="Observações"
                value={details.notes || "—"}
              />

              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Parcelas ({details.paidCount}/{details.installmentsQty}{" "}
                  pagas)
                </p>

                <div className="flex flex-col gap-2">
                  {details.installments.map((inst) => (
                    <div
                      key={inst.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-gray-100"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          {inst.number}/{inst.installmentsQty} ·{" "}
                          {formatBRL(inst.amount)}
                        </p>

                        <p className="text-xs text-gray-400">
                          vence {formatDate(inst.dueDate)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <InstallmentBadge status={inst.status} />

                        {inst.status !== "PAID" &&
                          inst.status !== "CANCELED" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePay(inst)}
                                disabled={payingId === inst.id}
                                aria-label={`Pagar parcela ${inst.number}`}
                                title="Pagar (vira lançamento)"
                                className="p-1.5 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Check className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditInstallment(inst)}
                                aria-label={`Editar parcela ${inst.number}`}
                                title="Editar valor/vencimento"
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </AppDialog>
      )}

      {/* modal editar parcela */}
      {editingInstallment && (
        <AppDialog
          open
          onOpenChange={(next) => {
            if (!next && !installmentSaving) {
              setEditingInstallment(null);
            }
          }}
          title={`Editar parcela ${editingInstallment.number}/${editingInstallment.installmentsQty}`}
          description="Altere só esta ou desta em diante."
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  if (!installmentSaving) {
                    setEditingInstallment(null);
                  }
                }}
                disabled={installmentSaving}
                className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveInstallment}
                disabled={installmentSaving}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "var(--color-interactive)",
                }}
              >
                {installmentSaving ? "Salvando..." : "Salvar"}
              </button>
            </>
          }
        >
          <div className="flex gap-2">
            {(["ONE", "FOLLOWING"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() =>
                  setInstallmentForm((f) => ({ ...f, scope: s }))
                }
                aria-pressed={installmentForm.scope === s}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition
                ${
                  installmentForm.scope === s
                    ? "bg-teal-50 border-teal-300 text-teal-700"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {s === "ONE" ? "Só esta" : "Desta em diante"}
              </button>
            ))}
          </div>

          {installmentForm.scope === "ONE" && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Valor (R$)
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={installmentForm.amount}
                onChange={(e) =>
                  setInstallmentForm((f) => ({
                    ...f,
                    amount: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-(--color-interactive)/30 transition"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              {installmentForm.scope === "FOLLOWING"
                ? "Novo vencimento desta (as próximas acompanham)"
                : "Vencimento"}
            </label>

            <input
              type="date"
              value={installmentForm.dueDate}
              onChange={(e) =>
                setInstallmentForm((f) => ({
                  ...f,
                  dueDate: e.target.value,
                }))
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-(--color-interactive)/30 transition"
            />
          </div>

          {installmentError && <FormAlert>{installmentError}</FormAlert>}
        </AppDialog>
      )}

      {/* modal excluir */}
      {deletingPurchase && (
        <AppDialog
          open
          onOpenChange={(next) => {
            if (!next && !deleting) {
              setDeletingPurchase(null);
            }
          }}
          title="Excluir conta?"
          description="Esta ação não pode ser desfeita."
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  if (!deleting) {
                    setDeletingPurchase(null);
                  }
                }}
                disabled={deleting}
                className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDeletePurchase}
                disabled={deleting}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Excluindo..." : "Excluir tudo"}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-700">
            Tem certeza que deseja excluir{" "}
            <strong>&quot;{deletingPurchase.title}&quot;</strong>?
          </p>

          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            <p>
              Serão apagados juntos: a compra, as{" "}
              <strong>
                {deletingPurchase.installments.length} parcela(s)
              </strong>{" "}
              e{" "}
              <strong>
                {deletingPurchase.generatedTransactionsCount}{" "}
                lançamento(s)
              </strong>{" "}
              gerados no extrato
              {deletingPurchase.paidCount > 0 && (
                <>
                  {" "}
                  (incluindo {deletingPurchase.paidCount} parcela(s) já
                  paga(s) — histórico)
                </>
              )}
              .
            </p>
          </div>

          {deleteError && <FormAlert>{deleteError}</FormAlert>}
        </AppDialog>
      )}
    </div>
  );
}
