import { ArrowUpRight } from "lucide-react";
import { ArrowDownLeft } from "lucide-react";

type TransactionProps ={
    id: string;
    title: string;
    amount: number;
    date: string;
}

export default function TransactionItem({id, title, amount, date}: TransactionProps) {
const isIncome = amount > 0;

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    }).format(value);
};

return (
    <div className="flex justify-between w-11/12 mx-auto items-center p-3 rounded-xl border-b-2 border-(--color-border) hover:bg-(--color-surface-secondary) transition">
    {/* esquerda */}
    <div className="flex flex-col">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <span className="text-xs text-gray-400">{date}</span>
    </div>

    {/* direita */}
    <div className="flex items-center gap-2">
    
    {isIncome ? (
    <ArrowUpRight className="w-4 h-4 text-(--color-positive)" />
    ) : (
    <ArrowDownLeft className="w-4 h-4 text-(--color-alert)" />
    )}

    <p
    className={`
        text-sm font-semibold
        ${isIncome ? "text-(--color-positive)" : "text-(--color-alert)"}
    `}
    >
    {formatCurrency(amount)}
    </p>

</div>
    </div>
);
}