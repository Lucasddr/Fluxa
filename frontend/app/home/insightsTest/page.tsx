"use client";

import { useCallback, useEffect, useState } from "react";

import ValueCard from "@/app/components/ValueCard";

import {
Brain,
Target,
TrendingUp,
Lightbulb,
} from "lucide-react";

type InsightDTO = {
id: string;
title: string;
description: string;
type: "INFO" | "WARNING" | "SUCCESS";
};

type CategoryRankingDTO = {
categoryName: string;
percentage: number;
amount: number;
};

type InsightPageDTO = {
financialScore: number;
savingsGoalProgress: number;
currentSavings: number;
projectedBalance: number;

categoryRanking: CategoryRankingDTO[];
insights: InsightDTO[];
};

export default function InsightsPage() {
const [data, setData] =
    useState<InsightPageDTO | null>(null);

const [loading, setLoading] =
    useState(true);


return (
    <div className="flex flex-col gap-6 w-full">

  {/* Header */}

  <div>
    <h2 className="text-2xl text-black">
      🧠 Insights Financeiros
    </h2>

    <p className="text-(--color-text-secondary)">
      Entenda seus hábitos financeiros e tendências futuras.
    </p>
  </div>

  {/* Cards */}

  <div className="grid grid-cols-4 gap-2">

    <ValueCard
      title="Score Financeiro"
      value="82/100"
      icon={<Brain className="text-blue-500" />}
      textColor="text-blue-500"
      bgColor="bg-(--color-surface)"
      iconBgColor="bg-blue-500/20"
    />

    <ValueCard
      title="Meta de Economia"
      value="75%"
      icon={<Target className="text-green-500" />}
      textColor="text-green-500"
      bgColor="bg-(--color-surface)"
      iconBgColor="bg-green-500/20"
    />

    <ValueCard
      title="Economia Atual"
      value="R$ 780"
      icon={<TrendingUp className="text-yellow-500" />}
      textColor="text-yellow-500"
      bgColor="bg-(--color-surface)"
      iconBgColor="bg-yellow-500/20"
    />

    <ValueCard
      title="Saldo Projetado"
      value="R$ 2.350"
      icon={<Lightbulb className="text-orange-500" />}
      textColor="text-orange-500"
      bgColor="bg-(--color-surface)"
      iconBgColor="bg-orange-500/20"
    />

  </div>

  {/* Insights Principais */}

  <div className="border-2 border-(--color-border) rounded-xl shadow-lg p-5">

    <h3 className="font-semibold text-lg mb-4">
      🧠 O que descobrimos este mês
    </h3>

    <div className="grid grid-cols-2 gap-4">

      <div className="border border-(--color-border) rounded-xl p-4">
        <h4 className="font-semibold mb-2">
          📈 Mercado
        </h4>

        <p className="text-sm text-(--color-text-secondary)">
          Seus gastos aumentaram 18% em relação ao mês anterior.
        </p>
      </div>

      <div className="border border-(--color-border) rounded-xl p-4">
        <h4 className="font-semibold mb-2">
          🎯 Meta
        </h4>

        <p className="text-sm text-(--color-text-secondary)">
          Você atingiu 75% da sua meta de economia.
        </p>
      </div>

      <div className="border border-(--color-border) rounded-xl p-4">
        <h4 className="font-semibold mb-2">
          ⚠️ Parcelamentos
        </h4>

        <p className="text-sm text-(--color-text-secondary)">
          Comprometem 34% da renda prevista dos próximos meses.
        </p>
      </div>

      <div className="border border-(--color-border) rounded-xl p-4">
        <h4 className="font-semibold mb-2">
          💡 Sugestão
        </h4>

        <p className="text-sm text-(--color-text-secondary)">
          Reduzindo lazer em 10%, sua meta mensal será atingida.
        </p>
      </div>

    </div>

  </div>

  {/* Gráfico + Ranking */}

  <div className="grid grid-cols-[1.2fr_0.8fr] gap-4 min-h-[400px]">

    <div className="border-2 border-(--color-border) rounded-xl shadow-lg p-5">

      <h3 className="font-semibold mb-4">
        Evolução Financeira
      </h3>

      <div className="flex items-center justify-center h-[280px] text-(--color-text-secondary)">
        📊 Gráfico de Tendência
      </div>

    </div>

    <div className="border-2 border-(--color-border) rounded-xl shadow-lg p-5">

      <h3 className="font-semibold mb-6">
        Categorias Mais Relevantes
      </h3>

      <div className="flex flex-col gap-6">

        <div>
          <div className="flex justify-between mb-2">
            <span>Mercado</span>
            <span>32%</span>
          </div>

          <div className="h-3 rounded-full bg-gray-200">
            <div className="h-3 rounded-full bg-blue-500 w-[32%]" />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span>Transporte</span>
            <span>24%</span>
          </div>

          <div className="h-3 rounded-full bg-gray-200">
            <div className="h-3 rounded-full bg-green-500 w-[24%]" />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span>Lazer</span>
            <span>18%</span>
          </div>

          <div className="h-3 rounded-full bg-gray-200">
            <div className="h-3 rounded-full bg-yellow-500 w-[18%]" />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span>Moradia</span>
            <span>14%</span>
          </div>

          <div className="h-3 rounded-full bg-gray-200">
            <div className="h-3 rounded-full bg-purple-500 w-[14%]" />
          </div>
        </div>

      </div>

    </div>

  </div>

</div>
);
}