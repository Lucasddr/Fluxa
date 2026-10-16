"use client";

import { Fragment, useCallback, useEffect, useState } from "react";

import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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

function CategoryIcon({
  icon,
  color,
}: {
  icon: string;
  color: string;
}) {
  const Icon = ICON_MAP[icon] ?? ShoppingCart;

  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: color + "22" }}
    >
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
  );
}

// ─── badges ────────────────────────────────────────────────────

function TypeBadge({
  kind,
}: {
  kind: "INCOME" | "EXPENSE";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
      ${
        kind === "EXPENSE"
          ? "bg-red-50 text-red-600 border border-red-100"
          : "bg-green-50 text-green-600 border border-green-100"
      }`}
    >
      {kind === "EXPENSE" ? "↙ Despesa" : "↗ Receita"}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
      ${
        status
          ? "bg-green-50 text-green-600 border border-green-100"
          : "bg-gray-100 text-gray-500 border border-gray-200"
      }`}
    >
      {status ? "Ativa" : "Inativa"}
    </span>
  );
}

// ─── select ────────────────────────────────────────────────────

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
        } appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700`}
      >
        {children}
      </select>

      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ─── page ──────────────────────────────────────────────────────
export default function CategoriasPage() {
  const { toast } = useToast();

  const [categories, setCategories] =
    useState<PageResponse<Category> | null>(null);

  const [loading, setLoading] = useState(true);

  const [loaded, setLoaded] = useState(false);

  const [listError, setListError] =
    useState<string | null>(null);

  const [page, setPage] = useState(0);

  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);

  const [detailsCat, setDetailsCat] =
    useState<Category | null>(null);

  const [editingCat, setEditingCat] =
    useState<Category | null>(null);

  const [deletingCat, setDeletingCat] =
    useState<Category | null>(null);

  const [deleting, setDeleting] = useState(false);

  const [deleteError, setDeleteError] =
    useState<string | null>(null);

  // ─── fetch ───────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setListError(null);

      const response = await listCategories(
        page,
        itemsPerPage
      );

      if (!response.ok) {
        throw new HttpError(response.status);
      }

      const data: PageResponse<Category> =
        await response.json();

      setCategories(data);
      setLoaded(true);

    } catch (error) {
      console.error("Erro ao buscar categorias:", error);

      const message =
        error instanceof HttpError
          ? friendlyHttpError(error.status)
          : "Não foi possível carregar as categorias. Tente novamente.";

      setListError(message);
      toast(message, "error");

    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, toast]);

  // ─── delete ─────────────────────────────────────────────────

  async function handleDeleteCategory() {

    if (!deletingCat || deleting) {
      return;
    }

    setDeleteError(null);
    setDeleting(true);

    try {

      const res = await deleteCategory(
        deletingCat.id
      );

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

      await fetchCategories();

      setDeletingCat(null);
      setDetailsCat(null);
      toast("Categoria excluída com sucesso.");

    } catch (error) {

      console.error(
        "Erro ao excluir categoria:",
        error
      );

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

  // ─── effects ─────────────────────────────────────────────────

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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

      await fetchCategories();
      toast(
        cat.status
          ? "Categoria desativada."
          : "Categoria ativada."
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar categoria:",
        error
      );
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
            icon: cat.status ? Power : Power,
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

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Categorias
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            Organize suas receitas e despesas.
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
          Nova Categoria
        </button>
      </div>

      {/* filtros */}
      <div className="bg-white border border-(--color-border) rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-800" />

          <input
            type="text"
            placeholder="Buscar categorias..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600"
          />
        </div>

        <FilterSelect fullWidth value="" onChange={() => {}}>
          <option>Todos os tipos</option>
        </FilterSelect>

        <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg ml-auto">
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* tabela */}
      <div className="bg-white border border-(--color-border) rounded-2xl shadow-sm overflow-hidden">

        {/* topo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Lista de Categorias
            </h2>

            <p className="text-sm mt-0.5">
              <span className="text-(--color-interactive) font-semibold">
                {categories?.totalElements ?? 0}
              </span>

              <span className="text-gray-400">
                {" "}
                categorias encontradas
              </span>
            </p>
          </div>
        </div>

        {/* header (desktop) */}
        <div className="hidden lg:grid grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
            onRetry={fetchCategories}
          />
        ) : categories?.content.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            Nenhuma categoria encontrada.
          </div>
        ) : (
          categories?.content.map((cat) => (
            <Fragment key={cat.id}>
            <div
              className="hidden lg:grid grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 px-6 py-4 border-b border-(--color-border)/80 hover:bg-gray-50/60 transition items-center"
            >
              <div className="flex items-center gap-3">
                <CategoryIcon
                  icon={cat.icon}
                  color={cat.color}
                />

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {cat.name}
                  </p>
                </div>
              </div>

              <TypeBadge kind={cat.kind} />

              <p className="text-sm text-gray-500">
                {cat.description}
              </p>

              <StatusBadge status={cat.status} />

              <div className="relative">
                <CatMenu cat={cat} />
              </div>
            </div>

            {/* Card mobile */}

            <div className="lg:hidden px-4 py-4 border-b border-(--color-border)/80">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon
                    icon={cat.icon}
                    color={cat.color}
                  />

                  <p className="text-sm font-semibold text-gray-800 truncate">
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
                  <span className="text-xs text-gray-400 truncate">
                    {cat.description}
                  </span>
                ) : null}
              </div>
            </div>
            </Fragment>
          ))
        )}

        {/* paginação */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">

          <p className="text-sm text-gray-400">
            Página {(categories?.number ?? 0) + 1}
          </p>

          <div className="flex items-center gap-2">

            <button
              onClick={() =>
                setPage((prev) => Math.max(0, prev - 1))
              }
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>

            <button
              onClick={() =>
                setPage((prev) => prev + 1)
              }
              disabled={
                page >=
                (categories?.totalPages ?? 1) - 1
              }
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
        <CategoryModal
          title="Nova Categoria"
          description="Preencha os dados abaixo para criar uma nova categoria."
          submitLabel="Salvar Categoria"
          onClose={() => setModalOpen(false)}
          onSave={async () => {
            await fetchCategories();
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
            await fetchCategories();
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
                className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setDeletingCat(detailsCat);
                }}
                className="px-5 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-600 hover:bg-red-50 transition"
              >
                Excluir
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingCat(detailsCat);
                  setDetailsCat(null);
                }}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition hover:brightness-110"
                style={{
                  backgroundColor: "var(--color-interactive)",
                }}
              >
                Editar
              </button>
            </>
          }
        >
          <div className="flex items-center gap-3 pb-1">
            <CategoryIcon
              icon={detailsCat.icon}
              color={detailsCat.color}
            />

            <div>
              <p className="text-base font-semibold text-gray-900">
                {detailsCat.name}
              </p>

              <p className="text-xs text-gray-400">
                {detailsCat.kind === "INCOME" ? "Receita" : "Despesa"}
              </p>
            </div>
          </div>

          <DetailRow
            label="Cor"
            value={detailsCat.color}
          />

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
                className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDeleteCategory}
                disabled={deleting}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-700">
            Tem certeza que deseja excluir a categoria{" "}
            <strong>&quot;{deletingCat.name}&quot;</strong>?
          </p>

          {deleteError && (
            <FormAlert>{deleteError}</FormAlert>
          )}
        </AppDialog>
      )}
    </div>

  );
}

