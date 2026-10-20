"use client";

import { Fragment, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  MoreVertical,
  ShoppingCart,
  Home,
  Car,
  Heart,
  GraduationCap,
  Smile,
  TrendingUp,
  Briefcase,
  Zap,
  Coffee,
  DollarSign,
  Utensils,
  Trash2,
  Eye,
  Power,
} from "lucide-react";

import MenuListModal from "@/app/components/modals/MenuListmodal";
import CategoryModal from "@/app/components/modals/CategoryModal";
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
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/services/categories";

// ─── types ─────────────────────────────────────────────────────

type Category = {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  description: string;
  status: boolean;
};

type PageResponse<C> = {
  content: C[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

// ─── icon map ──────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingCart,
  Home,
  Car,
  Heart,
  GraduationCap,
  Smile,
  TrendingUp,
  Briefcase,
  Zap,
  Coffee,
  DollarSign,
  Utensils,
};

function CategoryIcon({ icon, color }: { icon: string; color: string }) {
  const Icon = ICON_MAP[icon] ?? ShoppingCart;

  return (
    <div
      className="w-9 h-9 rounded-[var(--radius)] flex items-center justify-center shrink-0"
      style={{ backgroundColor: color + "22" }}
    >
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
  );
}

// ─── badges ────────────────────────────────────────────────────

function TypeBadge({ kind }: { kind: "INCOME" | "EXPENSE" }) {
  return (
    <Badge variant={kind === "EXPENSE" ? "negative" : "positive"}>
      {kind === "EXPENSE" ? "↙ Despesa" : "↗ Receita"}
    </Badge>
  );
}

function StatusBadge({ status }: { status: boolean }) {
  return (
    <Badge variant={status ? "positive" : "neutral"}>
      {status ? "Ativa" : "Inativa"}
    </Badge>
  );
}

// ─── page ──────────────────────────────────────────────────────

export default function CategoriasPage() {
  const { toast } = useToast();

  const [categories, setCategories] =
    useState<PageResponse<Category> | null>(null);

  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);

  const [detailsCat, setDetailsCat] = useState<Category | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [retryKey, setRetryKey] = useState(0);

  // ─── fetch ───────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        setLoading(true);
        setListError(null);

        const response = await listCategories(page, itemsPerPage);

        if (!response.ok) {
          throw new HttpError(response.status);
        }

        const data: PageResponse<Category> = await response.json();

        if (!cancelled) {
          setCategories(data);
          setLoaded(true);
        }
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);

        const message =
          error instanceof HttpError
            ? friendlyHttpError(error.status)
            : "Não foi possível carregar as categorias. Tente novamente.";

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

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [page, itemsPerPage, toast, retryKey]);

  // ─── delete ─────────────────────────────────────────────────

  async function handleDeleteCategory() {
    if (!deletingCat || deleting) {
      return;
    }

    setDeleteError(null);
    setDeleting(true);

    try {
      const res = await deleteCategory(deletingCat.id);

      if (!res.ok) {
        if (res.status === 409) {
          const data = await res.json().catch(() => null);
          const message =
            data?.errors?.[0] ??
            "Categoria possui vínculos e não pode ser excluída.";

          throw new Error(message);
        }

        throw new HttpError(res.status);
      }

      setRetryKey((k) => k + 1);

      setDeletingCat(null);
      setDetailsCat(null);
      toast("Categoria excluída com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);

      setDeleteError(
        error instanceof HttpError
          ? friendlyHttpError(error.status)
          : error instanceof Error
            ? error.message
            : "Não foi possível excluir. Tente novamente."
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleCategory(cat: Category) {
    try {
      const res = await updateCategory(cat.id, {
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
        color: cat.color,
        status: !cat.status,
      });

      if (!res.ok) {
        throw new Error(
          "Não foi possível atualizar o status. Tente novamente."
        );
      }

      setRetryKey((k) => k + 1);
      toast(cat.status ? "Categoria desativada." : "Categoria ativada.");
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
      toast(
        "Não foi possível atualizar o status. Tente novamente.",
        "error"
      );
    }
  }

  function CatMenu({ cat }: { cat: Category }) {
    return (
      <MenuListModal
        trigger={
          <button
            type="button"
            aria-label="Abrir opções da categoria"
            className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] text-ink-3 transition-colors hover:text-ink hover:bg-line-subtle"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        }
        actions={[
          {
            label: "Ver detalhes",
            icon: Eye,
            onClick: () => {
              setDetailsCat(cat);
            },
          },
          {
            label: "Editar",
            icon: Pencil,
            onClick: () => {
              setEditingCat(cat);
            },
          },
          {
            label: cat.status ? "Desativar" : "Ativar",
            icon: Power,
            onClick: () => {
              handleToggleCategory(cat);
            },
          },
          {
            label: "Excluir",
            icon: Trash2,
            danger: true,
            onClick: () => {
              setDeleteError(null);
              setDeletingCat(cat);
            },
          },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categorias"
        subtitle="Organize suas receitas e despesas."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Nova Categoria
          </Button>
        }
      />

      {/* tabela */}
      <div className="rounded-[var(--radius)] border border-line bg-surface overflow-hidden">
        {/* topo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div>
            <h2 className="text-base font-medium text-ink">
              Lista de Categorias
            </h2>

            <p className="text-sm mt-0.5 text-ink-3">
              <span className="text-ink font-medium">
                {categories?.totalElements ?? 0}
              </span>{" "}
              categorias encontradas
            </p>
          </div>
        </div>

        {/* header (desktop) */}
        <div className="hidden lg:grid grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 px-6 py-3 bg-line-subtle border-b border-line text-xs font-medium text-ink-2 uppercase tracking-wide">
          <span>Categoria</span>
          <span>Tipo</span>
          <span>Descrição</span>
          <span>Status</span>
          <span>Ações</span>
        </div>

        {/* rows */}
        {loading ? (
          <div
            className="flex flex-col gap-2 px-6 py-4"
            role="status"
            aria-label="Carregando categorias"
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
        ) : categories?.content.length === 0 ? (
          <EmptyState
            title="Nenhuma categoria encontrada"
            description="Crie sua primeira categoria para organizar receitas e despesas."
            action={
              <Button onClick={() => setModalOpen(true)} size="sm">
                <Plus className="w-4 h-4" />
                Nova categoria
              </Button>
            }
          />
        ) : (
          categories?.content.map((cat) => (
            <Fragment key={cat.id}>
              <div className="hidden lg:grid grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 px-6 py-4 border-b border-line items-center hover:bg-line-subtle/60 transition-colors">
                <div className="flex items-center gap-3">
                  <CategoryIcon icon={cat.icon} color={cat.color} />

                  <p className="text-sm font-medium text-ink">{cat.name}</p>
                </div>

                <TypeBadge kind={cat.kind} />

                <p className="text-sm text-ink-2 truncate">{cat.description}</p>

                <StatusBadge status={cat.status} />

                <div className="relative">
                  <CatMenu cat={cat} />
                </div>
              </div>

              {/* Card mobile */}

              <div className="lg:hidden px-4 py-4 border-b border-line">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon icon={cat.icon} color={cat.color} />

                    <p className="text-sm font-medium text-ink truncate">
                      {cat.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <StatusBadge status={cat.status} />
                    <CatMenu cat={cat} />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <TypeBadge kind={cat.kind} />

                  {cat.description ? (
                    <span className="text-xs text-ink-3 truncate">
                      {cat.description}
                    </span>
                  ) : null}
                </div>
              </div>
            </Fragment>
          ))
        )}

        {/* paginação */}
        <div className="border-t border-line px-4 sm:px-6">
          <Pagination
            currentPage={categories?.number ?? page}
            totalPages={categories?.totalPages ?? 0}
            totalItems={categories?.totalElements ?? 0}
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
        <CategoryModal
          title="Nova Categoria"
          description="Preencha os dados abaixo para criar uma nova categoria."
          submitLabel="Salvar Categoria"
          onClose={() => setModalOpen(false)}
          onSave={async () => {
            setRetryKey((k) => k + 1);
            toast("Categoria criada com sucesso.");
          }}
        />
      )}

      {/* modal editar */}
      {editingCat && (
        <CategoryModal
          mode="edit"
          categoryId={editingCat.id}
          title="Editar Categoria"
          description="Altere os dados abaixo para atualizar a categoria."
          submitLabel="Salvar alterações"
          initialData={{
            name: editingCat.name,
            kind: editingCat.kind,
            icon: editingCat.icon,
            description: editingCat.description,
            color: editingCat.color,
            status: editingCat.status,
          }}
          onClose={() => setEditingCat(null)}
          onSave={async () => {
            setRetryKey((k) => k + 1);
            toast("Categoria atualizada com sucesso.");
          }}
        />
      )}

      {/* modal detalhes */}
      {detailsCat && (
        <AppDialog
          open
          onOpenChange={(next) => {
            if (!next) {
              setDetailsCat(null);
            }
          }}
          title="Detalhes da categoria"
          description={detailsCat.name}
          footer={
            <>
              <button
                type="button"
                onClick={() => setDetailsCat(null)}
                className="px-5 min-h-[44px] rounded-[var(--radius)] border border-line text-sm font-medium text-ink-2 transition-colors hover:text-ink hover:border-ink-3"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setDeletingCat(detailsCat);
                }}
                className="px-5 min-h-[44px] rounded-[var(--radius)] border border-negative/50 text-sm font-medium text-negative transition-colors hover:bg-negative hover:text-white"
              >
                Excluir
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingCat(detailsCat);
                  setDetailsCat(null);
                }}
                className="px-5 min-h-[44px] rounded-[var(--radius)] text-sm font-medium text-accent-ink bg-accent transition-opacity disabled:opacity-40"
              >
                Editar
              </button>
            </>
          }
        >
          <div className="flex items-center gap-3 pb-1">
            <CategoryIcon icon={detailsCat.icon} color={detailsCat.color} />

            <div>
              <p className="text-base font-medium text-ink">
                {detailsCat.name}
              </p>

              <p className="text-xs text-ink-3">
                {detailsCat.kind === "INCOME" ? "Receita" : "Despesa"}
              </p>
            </div>
          </div>

          <DetailRow label="Cor" value={detailsCat.color} />
          <DetailRow
            label="Descrição"
            value={detailsCat.description || "—"}
          />
          <DetailRow
            label="Status"
            value={detailsCat.status ? "Ativa" : "Inativa"}
          />
        </AppDialog>
      )}

      {/* modal excluir */}
      {deletingCat && (
        <AppDialog
          open
          onOpenChange={(next) => {
            if (!next && !deleting) {
              setDeletingCat(null);
            }
          }}
          title="Excluir categoria?"
          description="Esta ação não pode ser desfeita."
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  if (!deleting) {
                    setDeletingCat(null);
                  }
                }}
                disabled={deleting}
                className="px-5 min-h-[44px] rounded-[var(--radius)] border border-line text-sm font-medium text-ink-2 transition-colors hover:text-ink hover:border-ink-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDeleteCategory}
                disabled={deleting}
                className="px-5 min-h-[44px] rounded-[var(--radius)] text-sm font-medium text-white bg-negative transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </>
          }
        >
          <p className="text-sm text-ink-2">
            Tem certeza que deseja excluir a categoria{" "}
            <strong className="text-ink">
              &quot;{deletingCat.name}&quot;
            </strong>
            ?
          </p>

          {deleteError && <FormAlert>{deleteError}</FormAlert>}
        </AppDialog>
      )}
    </div>
  );
}
