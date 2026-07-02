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

const fetchInsights =
    useCallback(async () => {
    try {
        setLoading(true);

        /*
        const response = await api(
        "/reports/insights"
        );

        if (!response.ok) {
        throw new Error(
            "Erro ao carregar insights"
        );
        }

        const result: InsightPageDTO =
        await response.json();

        setData(result);
        */

    } catch (error) {
        console.error(
        "Erro ao carregar insights",
        error
        );
    } finally {
        setLoading(false);
    }
    }, []);

useEffect(() => {
    fetchInsights();
}, [fetchInsights]);

if (loading) {
    return (
    <div className="flex items-center justify-center h-full min-h-[400px] text-gray-400">
        Carregando insights...
    </div>
    );
}

if (!data) {
    return (
    <div className="flex items-center justify-center h-full min-h-[400px] text-gray-400">
        Nenhum insight encontrado.
    </div>
    );
}

return (
    <div className="flex flex-col gap-6 w-full">

    {/* HEADER */}

    <div>
        <h2 className="text-2xl text-black">
        Insights Financeiros
        </h2>

        <p className="text-(--color-text-secondary)">
        Entenda seus hábitos financeiros e
        tendências futuras.
        </p>
    </div>

    {/* CARDS */}

    <div className="grid grid-cols-4 gap-2">

        <ValueCard
        title="Score Financeiro"
        value={`${data.financialScore}/100`}
        icon={
            <Brain className="text-blue-500" />
        }
        textColor="text-blue-500"
        bgColor="bg-(--color-surface)"
        iconBgColor="bg-blue-500/20"
        />

        <ValueCard
        title="Meta de Economia"
        value={`${data.savingsGoalProgress}%`}
        icon={
            <Target className="text-(--color-positive)" />
        }
        textColor="text-(--color-positive)"
        bgColor="bg-(--color-surface)"
        iconBgColor="bg-(--color-positive)/20"
        />

        <ValueCard
        title="Economia Atual"
        value={`R$ ${data.currentSavings}`}
        icon={
            <TrendingUp className="text-(--color-neutral-alert)" />
        }
        textColor="text-(--color-neutral-alert)"
        bgColor="bg-(--color-surface)"
        iconBgColor="bg-(--color-neutral-alert)/20"
        />

        <ValueCard
        title="Saldo Projetado"
        value={`R$ ${data.projectedBalance}`}
        icon={
            <Lightbulb className="text-(--color-middle-alert)" />
        }
        textColor="text-(--color-middle-alert)"
        bgColor="bg-(--color-surface)"
        iconBgColor="bg-(--color-middle-alert)/20"
        />
    </div>

    {/* CONTEÚDO */}

    <div className="grid grid-cols-[1.2fr_0.8fr] gap-4 min-h-[520px]">

        {/* RANKING + TENDÊNCIAS */}

        <div className="grid grid-rows-2 gap-4">

        <div className="border-2 border-(--color-border) rounded-xl shadow-lg p-5">

            <h3 className="font-semibold mb-4">
            Evolução Financeira
            </h3>

            <div className="flex items-center justify-center h-full text-(--color-text-secondary)">
            Gráfico de tendências
            </div>

        </div>

        <div className="border-2 border-(--color-border) rounded-xl shadow-lg p-5">

            <h3 className="font-semibold mb-4">
            Ranking de Categorias
            </h3>

            <div className="flex flex-col gap-4">

            {data.categoryRanking.map(
                (category) => (
                <div
                    key={category.categoryName}
                >
                    <div className="flex justify-between mb-1">

                    <span>
                        {category.categoryName}
                    </span>

                    <span>
                        {category.percentage}%
                    </span>

                    </div>

                    <div className="w-full h-2 bg-gray-200 rounded">

                    <div
                        className="h-2 rounded bg-(--color-primary)"
                        style={{
                        width: `${category.percentage}%`,
                        }}
                    />

                    </div>
                </div>
                )
            )}

            </div>

        </div>

        </div>

        {/* INSIGHTS */}

        <div className="border-2 border-(--color-border) rounded-xl shadow-lg p-4">

        <h3 className="font-semibold mb-4">
            Insights Automáticos
        </h3>

        <div className="flex flex-col gap-3">

            {data.insights.map(
            (insight) => (
                <div
                key={insight.id}
                className="border border-(--color-border) rounded-xl p-4"
                >
                <h4 className="font-medium mb-2">
                    {insight.title}
                </h4>

                <p className="text-sm text-(--color-text-secondary)">
                    {insight.description}
                </p>
                </div>
            )
            )}

        </div>

        </div>

    </div>

    </div>
);
}