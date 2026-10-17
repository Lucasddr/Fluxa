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
        fill: "var(--positive)",
      },
      {
        name: "Saídas",
        value: expenses,
        fill: "var(--negative)",
      },
      {
        name: "Contas",
        value: accountsPayable,
        fill: "var(--warn)",
      },
    ],
    [entry, expenses, accountsPayable]
  );

  const total = useMemo(
    () => data.reduce((acc, item) => acc + item.value, 0),
    [data]
  );

  const activeItem = data[activeIndex] ?? data[0];
  const hasData = total > 0;

  const handlePieEnter = (_: unknown, index: number) => {
    setVisible(false);

    setTimeout(() => {
      setActiveIndex(index);
      setVisible(true);
    }, 120);
  };

  return (
    <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:gap-8 w-full h-full px-4 py-4">
      <div
        className={`shrink-0 ${
          isDesktop ? "w-[280px] h-[230px]" : "w-40 h-40"
        }`}
        aria-hidden={hasData}
      >
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={isDesktop ? 80 : 42}
                outerRadius={isDesktop ? 100 : 62}
                stroke="var(--paper)"
                strokeWidth={2}
                onMouseEnter={handlePieEnter}
              />

              <text
                x="50%"
                y="44%"
                textAnchor="middle"
                className={`fill-ink-3 transition-opacity duration-300 ${
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
                className={`fill-ink font-light tabular-nums transition-opacity duration-300 ${
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
        ) : (
          <div className="w-full h-full rounded-full border-[10px] border-line flex items-center justify-center">
            <span className="text-xs text-ink-3 text-center px-4 leading-snug">
              Sem dados no período
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 w-full lg:w-auto">
        <h2
          className={`font-medium text-ink mb-3 ${
            isDesktop ? "text-base" : "text-sm"
          }`}
        >
          Distribuição
        </h2>

        <div className="flex flex-col gap-2 lg:gap-3">
          {data.map((item, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                type="button"
                key={item.name}
                disabled={!hasData}
                aria-pressed={hasData ? isActive : undefined}
                onMouseEnter={() => handlePieEnter(null, index)}
                onClick={() => handlePieEnter(null, index)}
                className={`flex items-center justify-between w-full text-left rounded-[var(--radius)] transition-colors duration-[var(--dur-fast)] ${
                  isDesktop ? "px-3 py-3" : "px-2 py-2"
                } ${
                  hasData
                    ? "cursor-pointer"
                    : "cursor-default"
                } ${
                  isActive && hasData
                    ? "bg-surface"
                    : ""
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
                    className={`truncate text-ink-2 ${
                      isDesktop ? "text-sm" : "text-xs"
                    }`}
                  >
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 lg:gap-4">
                  <span
                    className={`font-medium tabular-nums text-ink whitespace-nowrap ${
                      isDesktop ? "text-sm" : "text-xs"
                    }`}
                  >
                    {formatCurrency(item.value)}
                  </span>

                  <span
                    className={`text-ink-3 w-8 text-right ${
                      isDesktop ? "text-sm" : "text-xs"
                    }`}
                  >
                    {hasData ? `${getPercentage(item.value, total)}%` : "—"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
