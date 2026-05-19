"use client";

import { useState } from "react";
import { X } from "lucide-react";

type TransactionModalProps = {
  onClose: () => void;
  onSave: (transaction: TransactionFormData) => void;
};

export type TransactionFormData = {
  type: "Entrada" | "Saída";
  value: string;
  category: string;
  date: string;
  paymentMethod: string;
  account: string;
  description: string;
  notes: string;
  recurring: boolean;
};

const CATEGORIES = [
  "Alimentação", "Salário", "Moradia", "Transporte",
  "Saúde", "Educação", "Lazer", "Investimentos",
  "Trabalho", "Entretenimento", "Outros",
];

const PAYMENT_METHODS = [
  "Conta Principal", "Cartão de Crédito", "Cartão de Débito", "Pix",
];

const ACCOUNTS = [
  "Conta Principal", "Conta de Investimentos", "Conta Poupança",
];

const TODAY = new Date().toISOString().split("T")[0];

export default function TransactionModal({ onClose, onSave }: TransactionModalProps) {
  const [form, setForm] = useState<TransactionFormData>({
    type: "Entrada",
    value: "",
    category: "",
    date: TODAY,
    paymentMethod: "",
    account: "",
    description: "",
    notes: "",
    recurring: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormData, string>>>({});

  function validate() {
    const e: typeof errors = {};
    if (!form.value || parseFloat(form.value) <= 0) e.value = "Informe um valor válido";
    if (!form.category) e.category = "Selecione uma categoria";
    if (!form.description.trim()) e.description = "Descrição é obrigatória";
    if (!form.paymentMethod) e.paymentMethod = "Selecione a forma de pagamento";
    if (!form.account) e.account = "Selecione uma conta";
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave(form);
    onClose();
  }

  function field(key: keyof TransactionFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  const inputClass = (err?: string) =>
    `w-full px-3 py-2 rounded-lg border text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 transition
    ${err ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-(--color-interactive)/30"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Nova Transação</h2>
            <p className="text-sm text-gray-400 mt-0.5">Preencha os dados abaixo para criar uma nova transação.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">

          {/* Tipo + Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Tipo</label>
              <div className="flex gap-2">
                {(["Entrada", "Saída"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition
                      ${form.type === t
                        ? t === "Entrada"
                          ? "bg-green-50 border-green-300 text-green-600"
                          : "bg-red-50 border-red-300 text-red-600"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                  >
                    {t === "Entrada" ? "↗ Entrada" : "↙ Saída"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Valor</label>
              <div className={`flex items-center border rounded-lg overflow-hidden transition
                ${errors.value ? "border-red-400" : "border-gray-200 focus-within:ring-2 focus-within:ring-(--color-interactive)/30"}`}>
                <span className="px-3 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 py-2 shrink-0">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.value}
                  onChange={(e) => field("value", e.target.value)}
                  className="flex-1 px-3 py-2 text-sm text-gray-800 focus:outline-none bg-white"
                />
              </div>
              {errors.value && <p className="text-xs text-red-500 mt-1">{errors.value}</p>}
            </div>
          </div>

          {/* Categoria + Data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Categoria</label>
              <select value={form.category} onChange={(e) => field("category", e.target.value)} className={inputClass(errors.category)}>
                <option value="">Selecione uma categoria</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Data</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => field("date", e.target.value)}
                className={inputClass()}
              />
            </div>
          </div>

          {/* Forma de Pagamento + Conta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Forma de Pagamento</label>
              <select value={form.paymentMethod} onChange={(e) => field("paymentMethod", e.target.value)} className={inputClass(errors.paymentMethod)}>
                <option value="">Selecione a forma de pagamento</option>
                {PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.paymentMethod && <p className="text-xs text-red-500 mt-1">{errors.paymentMethod}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Conta</label>
              <select value={form.account} onChange={(e) => field("account", e.target.value)} className={inputClass(errors.account)}>
                <option value="">Selecione a conta</option>
                {ACCOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.account && <p className="text-xs text-red-500 mt-1">{errors.account}</p>}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Descrição</label>
            <input
              type="text"
              placeholder="Ex.: Salário, Mercado, Netflix..."
              value={form.description}
              onChange={(e) => field("description", e.target.value)}
              className={inputClass(errors.description)}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          {/* Observações */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Observações <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              placeholder="Adicione uma observação..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-(--color-interactive)/30 transition"
            />
          </div>

          {/* Recorrente */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setForm((f) => ({ ...f, recurring: !f.recurring }))}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0`}
                  style={{ backgroundColor: form.recurring ? "var(--color-interactive)" : "#D1D5DB" }}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                    ${form.recurring ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">Transação recorrente</p>
                  <p className="text-xs text-gray-400">Repete esta transação automaticamente</p>
                </div>
              </div>
              <span className="text-gray-400 text-xs">▾</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition"
            style={{ backgroundColor: "var(--color-interactive)" }}
          >
            Salvar Transação
          </button>
        </div>
      </div>
    </div>
  );
}
