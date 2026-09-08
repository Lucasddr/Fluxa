"use client";

import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, ResponsiveContainer } from "recharts";
import { getPercentage } from "../utils/math";
import { formatCurrency } from "../utils/Formatters";

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
const [isDesktop, setIsDesktop] = useState(false);

useEffect(() => {
    const handleResize = () => {
    setIsDesktop(window.innerWidth >= 1024);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
}, []);

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
    () => data.reduce((acc, item) => acc + item.value, 0),
    [data]
);

const activeItem = data[activeIndex] ?? data[0];

const handlePieEnter = (_: unknown, index: number) => {
    setVisible(false);

    setTimeout(() => {
    setActiveIndex(index);
    setVisible(true);
    }, 120);
};

return (
    <div className="flex items-center gap-3 lg:gap-8 w-full h-full px-4 py-4">
    {/* DONUT */}

    <div
        className={`shrink-0 ${
        isDesktop ? "w-[320px] h-[230px]" : "w-40 h-40"
        }`}
    >
        <ResponsiveContainer width="100%" height="100%">
        <PieChart>
            <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={isDesktop ? 80 : 42}
            outerRadius={isDesktop ? 100 : 62}
            stroke="white"
            strokeWidth={2}
            onMouseEnter={handlePieEnter}
            />

            <text
            x="50%"
            y="44%"
            textAnchor="middle"
            className={`fill-gray-500 transition-opacity duration-300 ${
                visible ? "opacity-100" : "opacity-0"
            }`}
            style={{
                fontSize: isDesktop ? 14 : 10,
            }}
            >
            {activeItem.name}
            </text>

            <text
            x="50%"
            y="56%"
            textAnchor="middle"
            dominantBaseline="middle"
            className={`fill-gray-800 font-bold transition-opacity duration-300 ${
                visible ? "opacity-100" : "opacity-0"
            }`}
            style={{
                fontSize: isDesktop ? 22 : 13,
            }}
            >
            {formatCurrency(activeItem.value)}
            </text>
        </PieChart>
        </ResponsiveContainer>
    </div>

    {/* LEGENDA */}

    <div className="flex-1 min-w-0">
        <h3
        className={`font-semibold text-gray-900 mb-3 ${
            isDesktop ? "text-base" : "text-sm"
        }`}
        >
        Resumo das Categorias
        </h3>

        <div className="flex flex-col gap-2 lg:gap-3">
        {data.map((item, index) => {
            const isActive = index === activeIndex;

            return (
            <div
                key={item.name}
                onMouseEnter={() => handlePieEnter(null, index)}
                className={`flex items-center justify-between cursor-pointer rounded-xl transition-all ${
                isDesktop ? "px-3 py-3" : "px-2 py-2"
                } ${
                isActive
                    ? "bg-(--color-surface-active)/40"
                    : "hover:bg-(--color-surface-active)/40"
                }`}
            >
                <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                <div
                    className={`rounded-full ${
                    isDesktop ? "w-3 h-3" : "w-2.5 h-2.5"
                    }`}
                    style={{ backgroundColor: item.fill }}
                />

                <span
                    className={`truncate text-gray-700 ${
                    isDesktop ? "text-sm" : "text-xs"
                    }`}
                >
                    {item.name}
                </span>
                </div>

                <div className="flex items-center gap-2 lg:gap-4">
                <span
                    className={`font-semibold text-gray-900 whitespace-nowrap ${
                    isDesktop ? "text-sm" : "text-xs"
                    }`}
                >
                    {formatCurrency(item.value)}
                </span>

                <span
                    className={`text-gray-400 w-8 text-right ${
                    isDesktop ? "text-sm" : "text-xs"
                    }`}
                >
                    {getPercentage(item.value, total)}%
                </span>
                </div>
            </div>
            );
        })}
        </div>
    </div>
    </div>
);
}