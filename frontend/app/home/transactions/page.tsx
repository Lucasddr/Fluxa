"use client";

import { useState, useMemo } from "react";
import {
  Search, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight,
  Plus, MoreVertical, ArrowUpRight, ArrowDownLeft,
} from "lucide-react";
import TransactionModal, { type TransactionFormData } from "@/app/components/modals/TransactionModal";

// ─── tipos ────────────────────────────────────────────────────────────────────
type Transaction = {
  id: string;
  description: string;
  subtitle: string;
  category: string;
  categoryColor: string;
  type: "Entrada" | "Saída";
  date: string;
  dateLabel: string;
  paymentMethod: string;
  paymentIcon: "bank" | "credit" | "debit" | "pix";
  account: string;
  value: number;
};

// ─── dados mockados ────────────────────────────────────────────────────────────
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "1",  description: "Salário",       subtitle: "Recebimento",         category: "Entradas",       categoryColor: "#22C55E", type: "Entrada", date: "31/05/2025", dateLabel: "Hoje",         paymentMethod: "Conta Principal",   paymentIcon: "bank",   account: "Conta Principal",   value:  3000    },
  { id: "2",  description: "Mercado",       subtitle: "Compras do mês",      category: "Alimentação",    categoryColor: "#3B82F6", type: "Saída",   date: "30/05/2025", dateLabel: "Ontem",        paymentMethod: "Cartão de Crédito", paymentIcon: "credit", account: "Conta Principal",   value: -120     },
  { id: "3",  description: "Netflix",       subtitle: "Assinatura mensal",   category: "Entretenimento", categoryColor: "#EF4444", type: "Saída",   date: "29/05/2025", dateLabel: "2 dias atrás", paymentMethod: "Cartão de Crédito", paymentIcon: "credit", account: "Conta Principal",   value: -39      },
  { id: "4",  description: "Uber",          subtitle: "Transporte",          category: "Transporte",     categoryColor: "#8B5CF6", type: "Saída",   date: "28/05/2025", dateLabel: "3 dias atrás", paymentMethod: "Cartão de Débito",  paymentIcon: "debit",  account: "Conta Principal",   value: -25.50   },
  { id: "5",  description: "Freelance",     subtitle: "Projeto de design",   category: "Trabalho",       categoryColor: "#14B8A6", type: "Entrada", date: "27/05/2025", dateLabel: "4 dias atrás", paymentMethod: "Conta Principal",   paymentIcon: "bank",   account: "Conta Principal",   value:  1200    },
  { id: "6",  description: "Aluguel",       subtitle: "Aluguel do apartamento", category: "Moradia",    categoryColor: "#F97316", type: "Saída",   date: "26/05/2025", dateLabel: "5 dias atrás", paymentMethod: "Pix",               paymentIcon: "pix",    account: "Conta Principal",   value: -1500    },
  { id: "7",  description: "Supermercado",  subtitle: "Compras semanais",    category: "Alimentação",    categoryColor: "#3B82F6", type: "Saída",   date: "25/05/2025", dateLabel: "6 dias atrás", paymentMethod: "Cartão de Débito",  paymentIcon: "debit",  account: "Conta Principal",   value: -89.90   },
  { id: "8",  description: "Vendas Online", subtitle: "Venda de produto",    category: "Outros",         categoryColor: "#6B7280", type: "Entrada", date: "24/05/2025", dateLabel: "7 dias atrás", paymentMethod: "Conta Principal",   paymentIcon: "bank",   account: "Conta Principal",   value:  250     },
  { id: "9",  description: "Academia",      subtitle: "Mensalidade",         category: "Saúde",          categoryColor: "#EC4899", type: "Saída",   date: "23/05/2025", dateLabel: "8 dias atrás", paymentMethod: "Cartão de Crédito", paymentIcon: "credit", account: "Conta Principal",   value: -99      },
  { id: "10", description: "Dividendos",    subtitle: "Rendimento de FIIs",  category: "Investimentos",  categoryColor: "#22C55E", type: "Entrada", date: "22/05/2025", dateLabel: "9 dias atrás", paymentMethod: "Conta Principal",   paymentIcon: "bank",   account: "Conta de Investimentos", value: 312  },
  { id: "11", description: "Spotify",       subtitle: "Assinatura mensal",   category: "Entretenimento", categoryColor: "#EF4444", type: "Saída",   date: "21/05/2025", dateLabel: "10 dias atrás",paymentMethod: "Cartão de Crédito", paymentIcon: "credit", account: "Conta Principal",   value: -21      },
  { id: "12", description: "Farmácia",      subtitle: "Medicamentos",        category: "Saúde",          categoryColor: "#EC4899", type: "Saída",   date: "20/05/2025", dateLabel: "11 dias atrás",paymentMethod: "Pix",               paymentIcon: "pix",    account: "Conta Principal",   value: -65.40   },
];

const CATEGORIES = ["Todas as categorias", "Entradas", "Alimentação", "Entretenimento", "Transporte", "Trabalho", "Moradia", "Saúde", "Investimentos", "Outros"];
const PAYMENT_METHODS = ["Todos os cartões", "Conta Principal", "Cartão de Crédito", "Cartão de Débito", "Pix"];
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20];

// ─── ícone de pagamento ────────────────────────────────────────────────────────
function PaymentIcon({ type }: { type: Transaction["paymentIcon"] }) {
  if (type === "pix") {
    return (
      <div className="w-5 h-5 rounded flex items-center justify-center bg-teal-100">
        <span className="text-teal-600 text-[9px] font-bold rotate-45">◆</span>
      </div>
    );
  }
  return (
    <div className={`w-5 h-5 rounded flex items-center justify-center
      ${type === "bank" ? "bg-blue-100" : type === "credit" ? "bg-indigo-100" : "bg-purple-100"}`}>
      <div className={`w-3 h-2 rounded-sm
        ${type === "bank" ? "bg-blue-400" : type === "credit" ? "bg-indigo-400" : "bg-purple-400"}`} />
    </div>
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

// ─── badge de tipo ─────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: "Entrada" | "Saída" }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
      ${type === "Entrada"
        ? "bg-green-50 text-green-600 border border-green-100"
        : "bg-red-50 text-red-600 border border-red-100"
      }`}>
      {type}
    </span>
  );
}

// ─── badge de categoria ────────────────────────────────────────────────────────
function CategoryBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
      style={{ backgroundColor: color + "18", color, borderColor: color + "40" }}
    >
      {name}
    </span>
  );
}

// ─── formata valor ─────────────────────────────────────────────────────────────
function formatBRL(value: number) {
  return Math.abs(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── página ────────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todas as categorias");
  const [filterType, setFilterType] = useState("Todos os tipos");
  const [filterPayment, setFilterPayment] = useState("Todos os cartões");
  const [sortBy, setSortBy] = useState("Mais recentes");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (search) list = list.filter((t) => t.description.toLowerCase().includes(search.toLowerCase()) || t.subtitle.toLowerCase().includes(search.toLowerCase()));
    if (filterCategory !== "Todas as categorias") list = list.filter((t) => t.category === filterCategory);
    if (filterType !== "Todos os tipos") list = list.filter((t) => t.type === filterType);
    if (filterPayment !== "Todos os cartões") list = list.filter((t) => t.paymentMethod === filterPayment);
    return list;
  }, [transactions, search, filterCategory, filterType, filterPayment]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  function handleSaveTransaction(data: TransactionFormData) {
    const newT: Transaction = {
      id: String(Date.now()),
      description: data.description,
      subtitle: data.notes || data.category,
      category: data.category,
      categoryColor: "#6B7280",
      type: data.type,
      date: data.date,
      dateLabel: "Agora",
      paymentMethod: data.paymentMethod,
      paymentIcon: data.paymentMethod.includes("Crédito") ? "credit" : data.paymentMethod.includes("Débito") ? "debit" : data.paymentMethod === "Pix" ? "pix" : "bank",
      account: data.account,
      value: data.type === "Entrada" ? parseFloat(data.value) : -parseFloat(data.value),
    };
    setTransactions((prev) => [newT, ...prev]);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transações</h1>
          <p className="text-sm text-gray-400 mt-1">Veja e gerencie todas as suas transações.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition"
          style={{ backgroundColor: "var(--color-interactive)" }}
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
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-interactive)/30"
          />
        </div>

        <FilterSelect value={filterCategory} onChange={(v) => { setFilterCategory(v); setPage(1); }}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </FilterSelect>

        <FilterSelect value={filterType} onChange={(v) => { setFilterType(v); setPage(1); }}>
          <option>Todos os tipos</option>
          <option>Entrada</option>
          <option>Saída</option>
        </FilterSelect>

        <FilterSelect value={filterPayment} onChange={(v) => { setFilterPayment(v); setPage(1); }}>
          {PAYMENT_METHODS.map((p) => <option key={p}>{p}</option>)}
        </FilterSelect>

        {/* Date range — visual only por ora */}
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white">
          <span>01/05/2025 – 31/05/2025</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>

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
            <h2 className="text-base font-semibold text-gray-900">Lista de Transações</h2>
            <p className="text-sm mt-0.5">
              <span className="text-(--color-interactive) font-semibold">{filtered.length}</span>
              <span className="text-gray-400"> transações encontradas</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Ordenar por:</span>
            <FilterSelect value={sortBy} onChange={setSortBy}>
              <option>Mais recentes</option>
              <option>Mais antigas</option>
              <option>Maior valor</option>
              <option>Menor valor</option>
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
        {paginated.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Nenhuma transação encontrada com os filtros aplicados.
          </div>
        ) : (
          paginated.map((t) => (
            <div
              key={t.id}
              className="grid grid-cols-[2fr_1.2fr_1fr_1.5fr_1.5fr_1fr_auto] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50/60 transition items-center"
            >
              {/* Descrição */}
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                  ${t.type === "Entrada" ? "bg-green-50" : "bg-red-50"}`}>
                  {t.type === "Entrada"
                    ? <ArrowUpRight className="w-4 h-4 text-green-500" />
                    : <ArrowDownLeft className="w-4 h-4 text-red-500" />
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t.description}</p>
                  <p className="text-xs text-gray-400">{t.subtitle}</p>
                </div>
              </div>

              {/* Categoria */}
              <CategoryBadge name={t.category} color={t.categoryColor} />

              {/* Tipo */}
              <TypeBadge type={t.type} />

              {/* Data */}
              <div>
                <p className="text-sm text-gray-700">{t.date}</p>
                <p className="text-xs text-gray-400">{t.dateLabel}</p>
              </div>

              {/* Forma de Pagamento */}
              <div className="flex items-center gap-2">
                <PaymentIcon type={t.paymentIcon} />
                <span className="text-sm text-gray-600">{t.paymentMethod}</span>
              </div>

              {/* Valor */}
              <div className="flex items-center gap-1">
                {t.type === "Entrada"
                  ? <ArrowUpRight className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  : null
                }
                <span className={`text-sm font-semibold
                  ${t.type === "Entrada" ? "text-green-600" : "text-red-500"}`}>
                  {t.type === "Saída" ? "-" : ""}{formatBRL(t.value)}
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
            Mostrando {filtered.length === 0 ? 0 : (page - 1) * itemsPerPage + 1} a {Math.min(page * itemsPerPage, filtered.length)} de {filtered.length} transações
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
                  ${p === page ? "text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
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
        <TransactionModal onClose={() => setModalOpen(false)} onSave={handleSaveTransaction} />
      )}
    </div>
  );
}
