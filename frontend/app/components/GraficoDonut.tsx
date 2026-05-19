"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, ResponsiveContainer } from "recharts";
import { getPercentage } from "../utils/math";

type ChartProps = {
entry?: number;
expenses?: number;
accountsPayable?: number;
};

type DataItem = {
name: string;
value: number;
fill: string;
};

export default function GraficoDonut({
entry = 0,
expenses = 0,
accountsPayable = 0,
}: ChartProps) {
const [activeIndex, setActiveIndex] = useState(0);
const [visible, setVisible] = useState(true);

// 🔥 evita recriação do array a cada render sem necessidade
const data: DataItem[] = useMemo(
    () => [
    {
        name: "Entradas",
        value: entry,
        fill: "var(--color-positive)",
    },
    {
        name: "Saídas",
        value: expenses,
        fill: "var(--color-alert)",
    },
    {
        name: "Contas",
        value: accountsPayable,
        fill: "var(--color-middle-alert)",
    },
    ],
    [entry, expenses, accountsPayable]
);

const total = useMemo(
    () => data.reduce((acc, item) => acc + (item.value || 0), 0),
    [data]
);

const activeItem = data[activeIndex] ?? data[0];

const formatCurrency = (value: number) =>
    (value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    });

const handlePieEnter = (_: unknown, index: number) => {
    setVisible(false);

    setTimeout(() => {
    setActiveIndex(index);
    setVisible(true);
    }, 120);
};

return (
    <div className="w-full flex items-center gap-8">
    {/* DONUT */}
    <div className="w-[320px] h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
        <PieChart>
            <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={100}
            stroke="white"
            strokeWidth={2}
            onMouseEnter={handlePieEnter}
            />

            {/* TEXTO CENTRAL */}
            <text
            x="50%"
            y="44%"
            textAnchor="middle"
            className={`fill-gray-500 text-sm transition-opacity duration-300 ${
                visible ? "opacity-100" : "opacity-0"
            }`}
            >
            {activeItem.name}
            </text>

            <text
            x="50%"
            y="56%"
            textAnchor="middle"
            dominantBaseline="middle"
            className={`fill-gray-800 text-xl font-bold transition-opacity duration-300 ${
                visible ? "opacity-100" : "opacity-0"
            }`}
            >
            {formatCurrency(activeItem.value)}
            </text>
        </PieChart>
        </ResponsiveContainer>
    </div>

    {/* LEGEND */}
    <div className="flex flex-col gap-3 w-full max-w-[420px] px-2">
        <div className="mb-2">
        <h3 className="text-md font-semibold text-gray-900">
            Resumo das Categorias
        </h3>
        </div>

        {data.map((item, index) => {
        const isActive = index === activeIndex;

        return (
            <div
            key={item.name}
            onMouseEnter={() => handlePieEnter(null, index)}
            className={`flex items-center justify-between cursor-pointer px-3 py-3 rounded-xl transition-all ${
                isActive
                ? "bg-(--color-surface-active)/40"
                : "hover:bg-(--color-surface-active)/40"
            }`}
            >
            {/* LEFT */}
            <div className="flex items-center gap-3">
                <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.fill }}
                />
                <span className="text-sm text-gray-700">{item.name}</span>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(item.value)}
                </span>

                <span className="text-sm font-medium text-gray-400 min-w-[40px] text-right">
                {getPercentage(item.value, total)}%
                </span>
            </div>
            </div>
        );
        })}
    </div>
    </div>
);
}