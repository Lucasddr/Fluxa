"use client";

import { Fragment, useEffect, useState } from "react";
import {
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
import PageHeader from "@/app/components/ui/PageHeader";
import Button from "@/app/components/ui/Button";
import Pagination from "@/app/components/ui/Pagination";
import Badge from "@/app/components/ui/Badge";
import EmptyState from "@/app/components/ui/EmptyState";

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
  const variants: Record<InstallmentStatus, React.ComponentProps<typeof Badge>["variant"]> = {
    PENDING: "warn",
    OVERDUE: "negative",
    PAID: "positive",
    CANCELED: "neutral",
  };

  const labels: Record<InstallmentStatus, string> = {
    PENDING: "Pendente",
    OVERDUE: "Vencida",
    PAID: "Paga",
    CANCELED: "Cancelada",
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
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

  const [retryKey, setRetryKey] = useState(0);

  // ─── fetch ───────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadPurchases() {
      try {
        setLoading(true);
        setListError(null);

        const response = await listCreditPurchases(page, itemsPerPage);

        if (!response.ok) {
          throw new HttpError(response.status);
        }

        const data: PageResponse<Purchase> = await response.json();

        if (!cancelled) {
          setPurchases(data);
          setLoaded(true);
        }
      } catch (error) {
        console.error("Erro ao buscar compras parceladas:", error);

        const message =
          error instanceof HttpError
            ? friendlyHttpError(error.status)
            : "Não foi possível carregar as compras parceladas. Tente novamente.";

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

    void loadPurchases();

    return () => {
      cancelled = true;
    };
  }, [page, itemsPerPage, toast, retryKey]);

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

  function newIdempotencyKey(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  async function handlePay(installment: Installment) {
    if (payingId) {
      return;
    }

    setPayingId(installment.id);

    try {
      const res = await payInstallment(installment.id, newIdempotencyKey());

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("Parcela já foi paga.");
        }

        throw new HttpError(res.status);
      }

      toast(
        `Parcela ${installment.number}/${installment.installmentsQty} paga. Virou lançamento no extrato.`
      );

      setRetryKey((k) => k + 1);

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

      setRetryKey((k) => k + 1);

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

      setRetryKey((k) => k + 1);

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

  function PurchaseMenu({ purchase }: { purchase: Purchase }) {
    return (
      <MenuListModal
        trigger={
          <button
            type="button"
            aria-label="Abrir opções da compra"
            className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] text-ink-3 transition-colors hover:text-ink hover:bg-surface"
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
      <PageHeader
        title="Parcelas"
        subtitle="Compras parceladas e compromissos futuros."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Nova compra parcelada
          </Button>
        }
      />

      {/* lista */}
      <div className="rounded-[var(--radius)] border border-line bg-surface overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div>
            <h2 className="text-base font-medium text-ink">
              Compras parceladas
            </h2>

            <p className="text-sm mt-0.5 text-ink-3">
              <span className="text-ink font-medium">
                {purchases?.totalElements ?? 0}
              </span>{" "}
              compras encontradas
            </p>
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-line-subtle border-b border-line text-xs font-medium text-ink-2 uppercase tracking-wide">
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
            aria-label="Carregando compras parceladas"
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
        ) : purchases?.content.length === 0 ? (
          <EmptyState
            title="Nenhuma compra parcelada"
            description="Crie sua primeira compra parcelada para acompanhar os compromissos futuros."
            action={
              <Button onClick={() => setModalOpen(true)} size="sm">
                <Plus className="w-4 h-4" />
                Nova compra parcelada
              </Button>
            }
          />
        ) : (
          purchases?.content.map((purchase) => (
            <Fragment key={purchase.id}>
              <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-line items-center hover:bg-line-subtle/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[var(--radius)] flex items-center justify-center shrink-0 bg-line-subtle">
                    <CreditCard className="w-4 h-4 text-ink-2" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-ink">
                      {purchase.title}
                    </p>

                    {purchase.merchant && (
                      <p className="text-xs text-ink-3">{purchase.merchant}</p>
                    )}
                  </div>
                </div>

                <p className="text-sm font-medium text-ink">
                  {formatBRL(purchase.totalAmount)}
                </p>

                <div>
                  <p className="text-xs text-ink-2">
                    {purchase.paidCount}/{purchase.installmentsQty} pagas
                  </p>

                  <div className="h-1.5 mt-1 rounded-full bg-line overflow-hidden">
                    <div
                      className="h-full rounded-full bg-ink transition-all"
                      style={{
                        width: `${
                          purchase.installmentsQty > 0
                            ? (purchase.paidCount / purchase.installmentsQty) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <p className="text-sm text-ink-2">{purchase.categoryName}</p>

                <div className="relative">
                  <PurchaseMenu purchase={purchase} />
                </div>
              </div>

              {/* Card mobile */}
              <div className="lg:hidden px-4 py-4 border-b border-line">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-[var(--radius)] flex items-center justify-center shrink-0 bg-line-subtle">
                      <CreditCard className="w-4 h-4 text-ink-2" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {purchase.title}
                      </p>

                      <p className="text-xs text-ink-3">
                        {formatBRL(purchase.totalAmount)} ·{" "}
                        {purchase.paidCount}/{purchase.installmentsQty} pagas
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <PurchaseMenu purchase={purchase} />
                  </div>
                </div>

                <div className="h-1.5 mt-2 rounded-full bg-line overflow-hidden">
                  <div
                    className="h-full rounded-full bg-ink transition-all"
                    style={{
                      width: `${
                        purchase.installmentsQty > 0
                          ? (purchase.paidCount / purchase.installmentsQty) *
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
        <div className="border-t border-line px-4 sm:px-6">
          <Pagination
            currentPage={purchases?.number ?? page}
            totalPages={purchases?.totalPages ?? 0}
            totalItems={purchases?.totalElements ?? 0}
            pageSize={itemsPerPage}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setItemsPerPage(size);
              setPage(0);
            }}
          />
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
            setRetryKey((k) => k + 1);
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
            setRetryKey((k) => k + 1);

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
          title="Detalhes da compra"
          description={details?.title ?? "Carregando..."}
          footer={
            details ? (
              <>
                <button
                  type="button"
                  onClick={() => setDetails(null)}
                  className="px-5 min-h-[44px] rounded-[var(--radius)] border border-line text-sm font-medium text-ink-2 transition-colors hover:text-ink hover:border-ink-3"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeletingPurchase(details);
                  }}
                  className="px-5 min-h-[44px] rounded-[var(--radius)] border border-negative/50 text-sm font-medium text-negative transition-colors hover:bg-negative hover:text-white"
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
                  className="px-5 min-h-[44px] rounded-[var(--radius)] text-sm font-medium text-accent-ink bg-accent transition-opacity disabled:opacity-40"
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
                <p className="text-sm font-medium text-ink mb-2">
                  Parcelas ({details.paidCount}/{details.installmentsQty} pagas)
                </p>

                {(() => {
                  const nextDue = details.installments
                    .filter(
                      (inst) =>
                        inst.status === "PENDING" || inst.status === "OVERDUE"
                    )
                    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

                  if (!nextDue) {
                    return null;
                  }

                  return (
                    <div className="mb-3 flex items-center justify-between gap-3 px-4 py-3 rounded-[var(--radius)] bg-ink text-paper">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ink-3">
                          Próximo vencimento · {nextDue.number}/
                          {nextDue.installmentsQty}
                        </p>

                        <p className="text-lg font-light leading-tight tabular-nums">
                          {formatBRL(nextDue.amount)}{" "}
                          <span className="text-xs font-medium text-ink-3">
                            vence {formatDate(nextDue.dueDate)}
                          </span>
                        </p>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePay(nextDue)}
                        loading={payingId === nextDue.id}
                        disabled={payingId === nextDue.id}
                      >
                        Pagar
                      </Button>
                    </div>
                  );
                })()}

                <div className="flex flex-col gap-2">
                  {details.installments.map((inst) => (
                    <div
                      key={inst.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[var(--radius)] border border-line"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">
                          {inst.number}/{inst.installmentsQty} ·{" "}
                          {formatBRL(inst.amount)}
                        </p>

                        <p className="text-xs text-ink-3">
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
                                className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] border border-line text-ink-2 hover:text-ink hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Check className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditInstallment(inst)}
                                aria-label={`Editar parcela ${inst.number}`}
                                title="Editar valor/vencimento"
                                className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] border border-line text-ink-2 hover:text-ink hover:bg-surface transition-colors"
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
                className="px-5 min-h-[44px] rounded-[var(--radius)] border border-line text-sm font-medium text-ink-2 transition-colors hover:text-ink hover:border-ink-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveInstallment}
                disabled={installmentSaving}
                className="px-5 min-h-[44px] rounded-[var(--radius)] text-sm font-medium text-accent-ink bg-accent transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
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
                className={`flex-1 py-2 px-3 rounded-[var(--radius)] text-sm font-medium border transition-colors ${
                  installmentForm.scope === s
                    ? "bg-ink text-paper border-ink"
                    : "border-line text-ink-2 hover:text-ink hover:border-ink-3"
                }`}
              >
                {s === "ONE" ? "Só esta" : "Desta em diante"}
              </button>
            ))}
          </div>

          {installmentForm.scope === "ONE" && (
            <div>
              <label htmlFor="installment-amount" className="block text-sm text-ink-2 mb-1.5">
                Valor (R$)
              </label>

              <input
                id="installment-amount"
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
                className="w-full px-3.5 min-h-[48px] rounded-[var(--radius)] border border-line bg-surface text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink-3"
                placeholder="0,00"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-ink-2 mb-1.5">
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
              className="w-full px-3.5 min-h-[48px] rounded-[var(--radius)] border border-line text-[15px] text-ink bg-surface focus:outline-none focus:border-ink-3 transition-colors"
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
          title="Excluir compra?"
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
                className="px-5 min-h-[44px] rounded-[var(--radius)] border border-line text-sm font-medium text-ink-2 transition-colors hover:text-ink hover:border-ink-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDeletePurchase}
                disabled={deleting}
                className="px-5 min-h-[44px] rounded-[var(--radius)] text-sm font-medium text-white bg-negative transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? "Excluindo..." : "Excluir tudo"}
              </button>
            </>
          }
        >
          <p className="text-sm text-ink-2">
            Tem certeza que deseja excluir{" "}
            <strong className="text-ink">
              &quot;{deletingPurchase.title}&quot;
            </strong>
            ?
          </p>

          <div className="mt-3 rounded-[var(--radius)] bg-warn-subtle border border-warn/20 p-3 text-sm text-warn">
            <p>
              Serão apagados juntos: a compra, as{" "}
              <strong>
                {deletingPurchase.installments.length} parcela(s)
              </strong>{" "}
              e{" "}
              <strong>
                {deletingPurchase.generatedTransactionsCount} lançamento(s)
              </strong>{" "}
              gerados no extrato
              {deletingPurchase.paidCount > 0 && (
                <>
                  {" "}
                  (incluindo {deletingPurchase.paidCount} parcela(s) já paga(s)
                  — histórico)
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
