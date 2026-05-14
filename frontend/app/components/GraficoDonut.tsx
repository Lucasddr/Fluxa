import { useState } from "react";
import { PieChart, Pie, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/app/utils/Formatters";
import { getPercentage } from "../utils/math";

type DataItem = {
name: string;
value: number;
fill: string;
};

export default function GraficoDoughnut() {
const [activeIndex, setActiveIndex] = useState<number>(0);
const [visible, setVisible] = useState<boolean>(true);

const data: DataItem[] = [
    {
    name: "Entradas",
    value: 25000,
    fill: "var(--color-positive)",
    },
    {
    name: "Saídas",
    value: 10000,
    fill: "var(--color-alert)",
    },
    {
    name: "Contas",
    value: 5000,
    fill: "var(--color-middle-alert)",
    },
];

const total = data.reduce((acc, item) => acc + item.value, 0);

const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    });
};

const onPieEnter = (_: unknown, index: number) => {
    setVisible(false);

    setTimeout(() => {
    setActiveIndex(index);
    setVisible(true);
    }, 150);
};

const activeItem = data[activeIndex];

return (
    <div className="w-full flex items-center gap-8">
        
        <div className="w-[320px] h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    stroke="white"
                    strokeWidth={2}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
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
                {activeItem?.name}
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
                {formatCurrency(activeItem?.value || 0)}
                </text>
            </PieChart>
            </ResponsiveContainer>
        </div>

        {/*LEGENDA */}
        <div className="flex flex-col gap-3 w-full max-w-[420px] px-2">

            {/* HEADER */}
            <div className="mb-2">
                <h3 className="text-md font-semibold text-gray-900">
                    Resumo das Categorias
                </h3>
            </div>

            {data.map((item, index) => {
            const isActive = index === activeIndex;

            return (
                <div
                    key={index}
                    onMouseEnter={() => onPieEnter(null, index)}
                    className={`flex items-center justify-between cursor-pointer px-3 py-3 rounded-xl transition-all
                    ${
                        isActive
                        ? "bg-(--color-surface-active)/40"
                        : "hover:bg-(--color-surface-active)/40"
                    }
                    `}
                >            
                <div className="flex items-center gap-3">
                    <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                    />

                    <span className="text-sm text-gray-700">
                    {item.name}
                    </span>
                </div>
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