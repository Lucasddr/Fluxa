import { TrendingUp, Tag, Calendar, Info, TriangleAlert, CircleCheck } from "lucide-react";

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

function SectionHead({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-ink-2">
        {icon}
        <span className="text-[13px]">{label}</span>
      </div>

      <Info size={15} className="text-ink-3" aria-hidden />
    </div>
  );
}

// ─── Card: Sua Economia ─────────────────────────────────────────────────────

function EconomyCard({ data }: { data: EconomyCardDTO }) {
  const rawProgress =
    (data.savingsPercentage / data.goalPercentage) * 100;

  const progress = Math.max(0, Math.min(rawProgress, 100));

  const reachedGoal = data.savingsPercentage >= data.goalPercentage;

  const isNegative = data.savingsPercentage < 0;
  const tone = isNegative ? "text-negative" : "text-positive";
  const bar = isNegative
    ? "bg-negative"
    : reachedGoal
      ? "bg-positive"
      : "bg-positive/60";

  return (
    <div className="border-t border-line pt-4 flex flex-col gap-1.5">
      <SectionHead
        icon={<TrendingUp size={15} aria-hidden />}
        label="Sua economia"
      />

      <p className={`text-[26px] font-light tabular-nums leading-none ${tone}`}>
        {data.savingsPercentage}%
      </p>

      <p className="text-sm text-ink-2">
        {isNegative
          ? `Você gastou ${Math.abs(
              data.savingsPercentage
            )}% a mais do que recebeu no período.`
          : `Você economizou ${data.savingsPercentage}% da sua renda no período.`}
      </p>

      <p className="text-sm text-ink-2">
        {isNegative ? (
          <>
            Saldo de {formatBRL(data.savedAmount)} para uma renda de{" "}
            {formatBRL(data.totalIncome)}.
          </>
        ) : (
          <>
            {formatBRL(data.savedAmount)} guardados de{" "}
            {formatBRL(data.totalIncome)} recebidos.
          </>
        )}
      </p>

      <div className="flex flex-col gap-1 mt-1">
        <div
          className="w-full h-1 bg-line rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da meta de economia"
        >
          <div
            className={`h-full rounded-full transition-all ${bar}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-ink-3">
          Meta recomendada: {data.goalPercentage}%
        </p>
      </div>
    </div>
  );
}

// ─── Card: Maior Categoria de Gastos ─────────────────────────────────────────

function MostExpenseCategoryCard({ data }: { data: MostExpenseCategoryDTO }) {
  return (
    <div className="border-t border-line pt-4 flex flex-col gap-1.5">
      <SectionHead
        icon={<Tag size={15} aria-hidden />}
        label="Maior gasto"
      />

      <p className="text-[26px] font-light leading-tight text-ink">
        {data.categoryName}
      </p>

      <p className="text-sm text-ink-2">
        {formatBRL(data.totalSpent)} gastos (
        {data.percentageOfExpenses}% das saídas).
      </p>

      <p className="text-xs text-ink-3">
        Reduzindo {data.suggestedReduction}%, você economiza{" "}
        {formatBRL(data.savingIfReduced)}.
      </p>
    </div>
  );
}

// ─── Card: Compromissos Futuros (Parcelas) ───────────────────────────────────

function InstallmentsAmountCard({ data }: { data: InstallmentsAmountDTO }) {
  return (
    <div className="border-t border-line pt-4 flex flex-col gap-1.5">
      <SectionHead
        icon={<Calendar size={15} aria-hidden />}
        label="Compromissos futuros"
      />

      <p className="text-[26px] font-light tabular-nums leading-none text-ink">
        {formatBRL(data.totalAmount)}
      </p>

      <p className="text-sm text-ink-2 flex items-center gap-1.5">
        {data.hasInstallments ? (
          <>
            <TriangleAlert size={14} className="text-warn shrink-0" aria-hidden />
            Fique atento aos vencimentos para evitar juros.
          </>
        ) : (
          <>
            <CircleCheck size={14} className="text-positive shrink-0" aria-hidden />
            Nenhuma conta a pagar à frente.
          </>
        )}
      </p>
    </div>
  );
}

// ─── Orquestrador ────────────────────────────────────────────────────────────

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

// ─── Export principal ────────────────────────────────────────────────────────

type InsightCardsProps = {
  cards: InsightCardDTO[];
};

export default function InsightCards({ cards }: InsightCardsProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section aria-label="Leituras do período">
      <h2 className="text-[15px] font-medium text-ink mb-4">
        Leituras
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
        {cards.map((card, index) => (
          <InsightCard key={index} data={card} />
        ))}
      </div>
    </section>
  );
}
