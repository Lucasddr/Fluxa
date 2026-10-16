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
            <ArrowUpRight className = "w-4 h-4 text-positive"/>
        ),
        signal: "+",
        color: "text-positive",
    } : {
        icon: (
            <ArrowDownLeft className = "w-4 h-4 text-negative"/>
        ),
        signal: "-",
        color: "text-negative"
    };


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    }).format(value);
};

return (
    <div className="flex justify-between items-center gap-3 py-3 border-b border-line">
    {/* esquerda */}
    <div className="flex flex-col min-w-0">
        <p className="text-sm text-ink truncate">{title}</p>
        <span className="text-xs text-ink-3">{date}</span>
    </div>

    {/* direita */}
    <div className="flex items-center gap-2 shrink-0">

    {transactionStyle.icon}
    <p
    className={`
        text-sm tabular-nums ${transactionStyle.color}`}
    >
    {transactionStyle.signal}
    {formatCurrency(amount)}
    </p>

</div>
    </div>
);
}