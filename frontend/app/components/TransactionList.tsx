"use client";

import TransactionItem from "./TransactionItem";

type Transaction = {
    id: string;
    amount: number;
    title: string;
    kind: string;
    date: string;
    account: string;
    categoryName: string;
}

type Props= {
    data: Transaction[];
}

export default function TransactionList({ data }: Props) {
return (
    <div className="flex flex-col gap-2 rounded-xl py-2">
    {data.map((t) => (
        <TransactionItem
        key={t.id}
        id={t.id}
        title={t.title}
        amount={t.amount}
        date={t.date}
        kind={t.kind}
        />
        
    ))}
    </div>
);
}