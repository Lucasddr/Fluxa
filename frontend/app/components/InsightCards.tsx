import { TrendingUp, Tag, Calendar, Info } from "lucide-react";

// ─── DTOs (espelham o que vem do back) ───────────────────────────────────────

type EconomyCardDTO = {
  type: "economy";
  savingsPercentage: number;       // ex: 18
  savedAmount: number;             // ex: 2340.00
  totalIncome: number;             // ex: 13000.00
  goalPercentage: number;          // ex: 20
};

type MostExpenseCategoryDTO = {
  type: "most_expense_category";
  categoryName: string;            // ex: "Mercado"
  totalSpent: number;              // ex: 820.00
  percentageOfExpenses: number;    // ex: 40
  suggestedReduction: number;      // ex: 10  (%)
  savingIfReduced: number;        // ex: 82.00
};

type InstallmentsAmountDTO = {
  type: "installments_amount";
  totalAmount: number;             // ex: 0.00
  hasInstallments: boolean;
};

type InsightCardDTO =
  | EconomyCardDTO
  | MostExpenseCategoryDTO
  | InstallmentsAmountDTO;

// ─── Utilitário ──────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// ─── Card: Sua Economia ───────────────────────────────────────────────────────

function EconomyCard({ data }: { data: EconomyCardDTO }) {

  const rawProgress =
    (data.savingsPercentage / data.goalPercentage) * 100;

  const progress = Math.max(0, Math.min(rawProgress, 100));

  const reachedGoal = data.savingsPercentage >= data.goalPercentage;

  const isNegative = data.savingsPercentage < 0;

  return (
    <div className="rounded-2xl bg-white border-2 border-(--color-border) shadow-lg p-5 flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isNegative ? "bg-red-50" : "bg-emerald-50"
            }`}
          >
            <TrendingUp
              size={16}
              className={
                isNegative
                  ? "text-red-500"
                  : "text-emerald-500"
              }
            />
          </div>

          <span className="text-sm font-medium text-gray-500">
            Sua economia
          </span>
        </div>

        <Info
          size={15}
          className="text-gray-300 cursor-pointer hover:text-gray-400"
        />
      </div>

      {/* Valor principal */}
      <p
        className={`text-xl font-bold ${
          isNegative
            ? "text-red-500"
            : "text-emerald-500"
        }`}
      >
        {data.savingsPercentage}%
      </p>

      <p className="text-sm text-gray-500 -mt-1">
        {isNegative
          ? `Você gastou ${Math.abs(
              data.savingsPercentage
            )}% a mais do que recebeu este mês.`
          : `Você economizou ${data.savingsPercentage}% da sua renda este mês.`}
      </p>

      {/* Info box */}
      <div
        className={`rounded-lg px-3 py-2 ${
          isNegative
            ? "bg-red-50"
            : "bg-emerald-50"
        }`}
      >
        <p
          className={`text-sm font-medium ${
            isNegative
              ? "text-red-700"
              : "text-emerald-700"
          }`}
        >
          {isNegative ? (
            <>
              Seu saldo ficou em{" "}
              <span className="font-semibold">
                {formatBRL(data.savedAmount)}
              </span>{" "}
              para uma renda de{" "}
              <span className="font-semibold">
                {formatBRL(data.totalIncome)}
              </span>
              .
            </>
          ) : (
            <>
              Você guardou{" "}
              <span className="font-semibold">
                {formatBRL(data.savedAmount)}
              </span>{" "}
              de{" "}
              <span className="font-semibold">
                {formatBRL(data.totalIncome)}
              </span>{" "}
              recebidos.
            </>
          )}
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="flex flex-col gap-1">
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isNegative
                ? "bg-red-500"
                : reachedGoal
                ? "bg-emerald-500"
                : "bg-emerald-400"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-gray-400">
          Meta recomendada: {data.goalPercentage}%
        </p>
      </div>
    </div>
  );
}

// ─── Card: Maior Categoria de Gastos ─────────────────────────────────────────

function MostExpenseCategoryCard({ data }: { data: MostExpenseCategoryDTO }) {
  return (
    <div className="rounded-2xl bg-white border-2 border-(--color-border) shadow-lg p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Tag size={16} className="text-amber-500" />
          </div>
          <span className="text-sm font-medium text-gray-500">Maior gasto</span>
        </div>
        <Info size={15} className="text-gray-300 cursor-pointer hover:text-gray-400" />
      </div>

      {/* Nome da categoria */}
      <p className="text-xl font-bold text-amber-500 leading-tight">
        {data.categoryName}
      </p>

      <p className="text-sm text-gray-500 -mt-1">
        Foi sua maior categoria de gastos neste mês.
      </p>

      {/* Info box — gastos */}
      <div className="rounded-l bg-amber-50 px-4 py-3">
        <p className="text-sm text-amber-600 font-medium">
          <span className="font-semibold">{formatBRL(data.totalSpent)}</span> gastos
        </p>
        <p className="text-xs text-amber-500">
          ({data.percentageOfExpenses}% do total de saídas)
        </p>
      </div>

      {/* Sugestão */}
      <div className="flex items-start gap-2 px-1">
        <p className="text-xs text-gray-400">
          Considere reduzir {data.suggestedReduction}% e economize{" "}
          <span className="font-medium text-gray-500">
            {formatBRL(data.savingIfReduced)}
          </span>
          .
        </p>
      </div>
    </div>
  );
}

// ─── Card: Compromissos Futuros (Parcelas) ────────────────────────────────────
function InstallmentsAmountCard({ data }: { data: InstallmentsAmountDTO }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Calendar size={16} className="text-blue-500" />
          </div>
          <span className="text-sm font-medium text-gray-500">
            Compromissos futuros
          </span>
        </div>
        <Info size={15} className="text-gray-300 cursor-pointer hover:text-gray-400" />
      </div>

      {/* Valor */}
      <p className="text-2xl font-bold text-blue-500">
        {formatBRL(data.totalAmount)}
      </p>

      <p className="text-sm text-gray-500 -mt-1">
        {data.hasInstallments
          ? "Você possui parcelas e contas a pagar."
          : "Você não possui contas a pagar futuras."}
      </p>

      {/* Mensagem de status */}
      <div className="rounded-xl bg-blue-50 px-4 py-3 flex items-start gap-2">
        {data.hasInstallments ? (
          <>
            <span className="text-blue-400 mt-0.5">⚠️</span>
            <p className="text-sm text-blue-600">
              Fique atento aos vencimentos para evitar juros.
            </p>
          </>
        ) : (
          <>
            <span className="text-blue-400 mt-0.5">✅</span>
            <p className="text-sm text-blue-600">
              Continue assim e mantenha suas finanças em dia!
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Orquestrador ─────────────────────────────────────────────────────────────

function InsightCard({ data }: { data: InsightCardDTO }) {
  switch (data.type) {
    case "economy":
      return <EconomyCard data={data} />;
    case "most_expense_category":
      return <MostExpenseCategoryCard data={data} />;
    case "installments_amount":
      return <InstallmentsAmountCard data={data} />;
  }
}

// ─── Export principal ─────────────────────────────────────────────────────────

type InsightCardsProps = {
  cards: InsightCardDTO[];
};

export default function InsightCards({ cards }: InsightCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 ">
      {cards.map((card, index) => (
        <InsightCard key={index} data={card} />
      ))}
    </div>
  );
}
