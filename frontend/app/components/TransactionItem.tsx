import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { formatCurrency } from "../utils/Formatters";

type TransactionProps = {
  title: string;
  amount: number;
  date: string;
  kind: string;
};

export default function TransactionItem({ title, amount, date, kind }: TransactionProps) {
  const isIncome = kind === "INCOME";

  return (
    <div className="flex justify-between items-center gap-3 py-3 border-b border-line">
      <div className="flex flex-col min-w-0">
        <p className="text-sm text-ink truncate">{title}</p>
        <span className="text-xs text-ink-3">{date}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isIncome ? (
          <ArrowUpRight className="w-4 h-4 text-positive" aria-hidden />
        ) : (
          <ArrowDownLeft className="w-4 h-4 text-negative" aria-hidden />
        )}

        <p
          className={`text-sm tabular-nums ${
            isIncome ? "text-positive" : "text-negative"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(amount)}
        </p>
      </div>
    </div>
  );
}
