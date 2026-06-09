"use client";

import { useCallback, useEffect, useState } from "react";

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
} from "lucide-react";

import MenuListModal from "@/app/components/modals/MenuListmodal";
import CategoryModal from "@/app/components/modals/CategoryModal";
import { api } from "@/services/api";

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
        className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700"
      >
        {children}
      </select>

      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ─── page ──────────────────────────────────────────────────────
export default function CategoriasPage() {
  const [categories, setCategories] =
    useState<PageResponse<Category> | null>(null);

  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);

  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [menuPosition, setMenuPosition] = useState({
  top: 0,
  left: 0,
});

  // ─── fetch ───────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api(
        `/categories/getCategories?page=${page}&size=${itemsPerPage}`
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar categorias");
      }

      const data: PageResponse<Category> =
        await response.json();

      setCategories(data);

    } catch (error) {
      console.error("Erro ao buscar categorias:", error);

    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage]);

  // ─── delete ─────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    const response = await api("/categories/delete", {
      method: "DELETE",
      body: JSON.stringify({
        categoryId: id
      })
    });

    if (response.ok) {
      await fetchCategories();
    }
};

const handleOpenMenu = (
  event: React.MouseEvent<HTMLButtonElement>,
  categoryId: string
) => {
  const rect = event.currentTarget.getBoundingClientRect();

  setMenuPosition({
    top: rect.bottom + window.scrollY + 0,
    left: rect.right + window.scrollX - 20,
  });

  setOpenMenuId(
    openMenuId === categoryId ? null : categoryId
  );
};

  // ─── effects ─────────────────────────────────────────────────

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
            setOpenMenuId(null);
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

        <FilterSelect value="" onChange={() => {}}>
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

        {/* header */}
        <div className="grid grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>Categoria</span>
          <span>Tipo</span>
          <span>Descrição</span>
          <span>Status</span>
          <span>Ações</span>
        </div>

        {/* rows */}
        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            Carregando...
          </div>
        ) : categories?.content.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            Nenhuma categoria encontrada.
          </div>
        ) : (
          categories?.content.map((cat) => (
            <div
              key={cat.id}
              className="grid grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 px-6 py-4 border-b border-(--color-border)/80 hover:bg-gray-50/60 transition items-center"
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
                <button
                    onClick={(e) =>
                    handleOpenMenu(e, cat.id)
                  }
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
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

      {/* modal */}
      {modalOpen && (
        <CategoryModal
          onClose={() => setModalOpen(false)}
          onSave={async () => {
            await fetchCategories();
          }}
        />
      )}
      {openMenuId && (
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
                label: "Ver detalhes",
                icon: Eye,
                onClick: () => {
                  const cat = categories?.content.find(
                    (c) => c.id === openMenuId
                  );

                  console.log(cat);

                  setOpenMenuId(null);
                },
              },
              {
                label: "Editar",
                icon: Pencil,
                onClick: () => {
                  console.log("editar", openMenuId);

                  setOpenMenuId(null);
                },
              },
              {
                label: "Excluir",
                icon: Trash2,
                danger: true,
                onClick: async () => {
                  const id = openMenuId;

                  setOpenMenuId(null);

                  if (id) {
                    
                  }
                },
              },
            ]}
          />
        </div>
      )}
    </div>
    
  );
}

