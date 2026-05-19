import { ArrowUpRight } from "lucide-react";
import { ArrowDownLeft } from "lucide-react";

type TransactionProps ={
    id: string;
    title: string;
    amount: number;
    date: string;
    kind: string;
}

export default function TransactionItem({id, title, amount, date, kind}: TransactionProps) {

const isIncome = kind === "INCOME";

const transactionStyle = isIncome ? {
        icon: (
            <ArrowUpRight className = "w-4 h-4 text-(--color-positive)"/>
        ),
        signal: "+",
        color: "text-(--color-positive)",
    } : {
        icon: (
            <ArrowDownLeft className = "w-4 h-4 text-(--color-alert)"/>
        ),
        signal: "-",
        color: "text-(--color-alert)"
    };


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
    
    {transactionStyle.icon}
    <p
    className={`
        text-sm font-semibold ${transactionStyle.color}`}
    >
    {transactionStyle.signal}
    {formatCurrency(amount)}
    </p>

</div>
    </div>
);
}