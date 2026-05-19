"use client";

import { useState, useMemo } from "react";
import {
  Search, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight,
  Plus, Pencil, MoreVertical,
  ShoppingCart, Home, Car, Heart, GraduationCap, Smile,
  TrendingUp, Briefcase, Zap, Coffee, DollarSign,
} from "lucide-react";
import CategoryModal, { type CategoryFormData } from "@/app/components/modals/CategoryModal";

// ─── tipos ────────────────────────────────────────────────────────────────────
type Category = {
  id: string;
  name: string;
  subtitle: string;
  type: "Despesa" | "Receita";
  account: string;
  description: string;
  status: "Ativa" | "Inativa";
  icon: string;
  color: string;
};

// ─── mapa de ícones ────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingCart, Home, Car, Heart, GraduationCap, Smile,
  TrendingUp, Briefcase, Zap, Coffee, DollarSign,
};

function CategoryIcon({ icon, color }: { icon: string; color: string }) {
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

// ─── dados mockados ────────────────────────────────────────────────────────────
const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Alimentação",  subtitle: "Despesas com alimentação",  type: "Despesa", account: "Conta Principal",        description: "Restaurantes, mercado, supermercado e similares", status: "Ativa", icon: "ShoppingCart", color: "#3B82F6" },
  { id: "2", name: "Salário",      subtitle: "Recebimento de salário",    type: "Receita", account: "Conta Principal",        description: "Salário mensal",                                 status: "Ativa", icon: "DollarSign",  color: "#22C55E" },
  { id: "3", name: "Moradia",      subtitle: "Aluguel, condomínio, contas", type: "Despesa", account: "Conta Principal",     description: "Aluguel, condomínio, contas de casa",            status: "Ativa", icon: "Home",        color: "#F97316" },
  { id: "4", name: "Transporte",   subtitle: "Gastos com transporte",     type: "Despesa", account: "Conta Principal",        description: "Combustível, transporte público, aplicativos",   status: "Ativa", icon: "Car",         color: "#8B5CF6" },
  { id: "5", name: "Saúde",        subtitle: "Despesas com saúde",        type: "Despesa", account: "Conta Principal",        description: "Consultas, medicamentos, exames",                status: "Ativa", icon: "Heart",       color: "#EC4899" },
  { id: "6", name: "Educação",     subtitle: "Cursos, faculdade, livros", type: "Despesa", account: "Conta Principal",        description: "Mensalidades, materiais, cursos",                status: "Ativa", icon: "GraduationCap", color: "#F59E0B" },
  { id: "7", name: "Lazer",        subtitle: "Entretenimento e lazer",    type: "Despesa", account: "Conta Principal",        description: "Cinema, streaming, passeios",                    status: "Ativa", icon: "Smile",       color: "#EF4444" },
  { id: "8", name: "Investimentos",subtitle: "Aplicações e investimentos",type: "Receita", account: "Conta de Investimentos", description: "Rendimentos de investimentos",                   status: "Ativa", icon: "TrendingUp",  color: "#22C55E" },
  { id: "9", name: "Trabalho",     subtitle: "Freelance e projetos",      type: "Receita", account: "Conta Principal",        description: "Projetos de design, desenvolvimento",            status: "Ativa", icon: "Briefcase",   color: "#14B8A6" },
  { id: "10",name: "Café",         subtitle: "Padarias e cafeterias",     type: "Despesa", account: "Conta Principal",        description: "Café, padarias, lanches",                        status: "Ativa", icon: "Coffee",      color: "#A16207" },
  { id: "11",name: "Energia",      subtitle: "Conta de luz e gás",        type: "Despesa", account: "Conta Principal",        description: "Contas de energia, gás e água",                  status: "Inativa",icon: "Zap",        color: "#EAB308" },
  { id: "12",name: "Streaming",    subtitle: "Serviços de streaming",     type: "Despesa", account: "Conta Principal",        description: "Netflix, Spotify, Disney+",                      status: "Ativa", icon: "Smile",       color: "#6366F1" },
];

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20];

// ─── badge de tipo ─────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: "Despesa" | "Receita" }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
      ${type === "Despesa"
        ? "bg-red-50 text-red-600 border border-red-100"
        : "bg-green-50 text-green-600 border border-green-100"
      }`}>
      {type === "Despesa" ? "↙" : "↗"} {type}
    </span>
  );
}

// ─── badge de status ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "Ativa" | "Inativa" }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
      ${status === "Ativa"
        ? "bg-green-50 text-green-600 border border-green-100"
        : "bg-gray-100 text-gray-500 border border-gray-200"
      }`}>
      {status}
    </span>
  );
}

// ─── select simples ────────────────────────────────────────────────────────────
function FilterSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
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

// ─── página ────────────────────────────────────────────────────────────────────
export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Todos os tipos");
  const [filterAccount, setFilterAccount] = useState("Todas as contas");
  const [filterStatus, setFilterStatus] = useState("Ativas");
  const [sortBy, setSortBy] = useState("Mais recentes");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);

  const accounts = useMemo(() => ["Todas as contas", ...Array.from(new Set(MOCK_CATEGORIES.map((c) => c.account)))], []);

  const filtered = useMemo(() => {
    let list = [...categories];

    if (search) list = list.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()));
    if (filterType !== "Todos os tipos") list = list.filter((c) => c.type === filterType);
    if (filterAccount !== "Todas as contas") list = list.filter((c) => c.account === filterAccount);
    if (filterStatus === "Ativas") list = list.filter((c) => c.status === "Ativa");
    if (filterStatus === "Inativas") list = list.filter((c) => c.status === "Inativa");

    return list;
  }, [categories, search, filterType, filterAccount, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  function handleSaveCategory(data: CategoryFormData) {
    const newCat: Category = {
      id: String(Date.now()),
      name: data.name,
      subtitle: data.description || `${data.type === "Despesa" ? "Despesas" : "Receitas"} com ${data.name.toLowerCase()}`,
      type: data.type,
      account: data.account,
      description: data.description,
      status: data.active ? "Ativa" : "Inativa",
      icon: data.icon,
      color: data.color,
    };
    setCategories((prev) => [newCat, ...prev]);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
          <p className="text-sm text-gray-400 mt-1">Organize suas receitas e despesas por categorias.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition"
          style={{ backgroundColor: "var(--color-interactive)" }}
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-(--color-border) rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        {/* Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar categorias..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-interactive)/30"
          />
        </div>

        <FilterSelect value={filterType} onChange={(v) => { setFilterType(v); setPage(1); }}>
          <option>Todos os tipos</option>
          <option>Despesa</option>
          <option>Receita</option>
        </FilterSelect>

        <FilterSelect value={filterAccount} onChange={(v) => { setFilterAccount(v); setPage(1); }}>
          {accounts.map((a) => <option key={a}>{a}</option>)}
        </FilterSelect>

        <FilterSelect value={filterStatus} onChange={(v) => { setFilterStatus(v); setPage(1); }}>
          <option>Todas</option>
          <option>Ativas</option>
          <option>Inativas</option>
        </FilterSelect>

        <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition ml-auto">
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-(--color-border) rounded-2xl shadow-sm overflow-hidden">

        {/* Topo da tabela */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Lista de Categorias</h2>
            <p className="text-sm mt-0.5">
              <span className="text-(--color-interactive) font-semibold">{filtered.length}</span>
              <span className="text-gray-400"> categorias encontradas</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Ordenar por:</span>
            <FilterSelect value={sortBy} onChange={setSortBy}>
              <option>Mais recentes</option>
              <option>Nome A-Z</option>
              <option>Tipo</option>
            </FilterSelect>
          </div>
        </div>

        {/* Cabeçalho */}
        <div className="grid grid-cols-[2fr_1fr_1.5fr_2fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>Categoria</span>
          <span>Tipo</span>
          <span>Conta</span>
          <span>Descrição</span>
          <span>Status</span>
          <span>Ações</span>
        </div>

        {/* Linhas */}
        {paginated.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Nenhuma categoria encontrada com os filtros aplicados.
          </div>
        ) : (
          paginated.map((cat) => (
            <div
              key={cat.id}
              className="grid grid-cols-[2fr_1fr_1.5fr_2fr_1fr_auto] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50/60 transition items-center"
            >
              {/* Categoria */}
              <div className="flex items-center gap-3">
                <CategoryIcon icon={cat.icon} color={cat.color} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                  <p className="text-xs text-gray-400">{cat.subtitle}</p>
                </div>
              </div>

              {/* Tipo */}
              <TypeBadge type={cat.type} />

              {/* Conta */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center">
                  <div className="w-2 h-1.5 rounded-sm bg-blue-400" />
                </div>
                <span className="text-sm text-gray-600">{cat.account}</span>
              </div>

              {/* Descrição */}
              <p className="text-sm text-gray-500 line-clamp-2">{cat.description}</p>

              {/* Status */}
              <StatusBadge status={cat.status} />

              {/* Ações */}
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600">
                  <Pencil className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* Paginação */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            Mostrando {filtered.length === 0 ? 0 : (page - 1) * itemsPerPage + 1} a {Math.min(page * itemsPerPage, filtered.length)} de {filtered.length} categorias
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition
                  ${p === page
                    ? "text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                style={p === page ? { backgroundColor: "var(--color-interactive)" } : {}}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Itens por página:</span>
            <FilterSelect value={String(itemsPerPage)} onChange={(v) => { setItemsPerPage(Number(v)); setPage(1); }}>
              {ITEMS_PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </FilterSelect>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <CategoryModal onClose={() => setModalOpen(false)} onSave={handleSaveCategory} />
      )}
    </div>
  );
}
