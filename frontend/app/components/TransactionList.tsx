"use client";

import TransactionItem from "./TransactionItem";

type TransactionProps = {
id: string;
title: string;
amount: number;
date: string;
};

type Props = {
data: TransactionProps[];
};

export default function TransactionList({ data }: Props) {
return (
    <div className="flex flex-col gap-2 rounded-xl shadow-lg py-2">
    {data.map((t) => (
        <TransactionItem
        key={t.id}
        id={t.id}
        title={t.title}
        amount={t.amount}
        date={t.date}
        />
    ))}
    </div>
);
}