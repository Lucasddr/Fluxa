"use client";

import ValueCard from "@/app/components/ValueCard";
import Grafico from "@/app/components/Grafico";
import GradificoDoughnut from "@/app/components/GraficoDonut";
import TransactionList from "@/app/components/TransactionList";
import { ArrowDownLeft, Banknote, DollarSign, User, Wallet } from 'lucide-react';

export default function DashboardPage() {
  const token = "fluxa_token_123456";
  const transactions = [
  { id: "1", title: "Salário", amount: 3000, date: "Hoje" },
  { id: "2", title: "Mercado", amount: -120, date: "Hoje" },
  { id: "3", title: "Netflix", amount: -39, date: "Ontem" },
  { id: "4", title: "Netflix", amount: -39, date: "Ontem" },
  { id: "5", title: "Mercado", amount: -120, date: "Hoje" },
  { id: "6", title: "Netflix", amount: -39, date: "Ontem" },
  { id: "7", title: "Netflix", amount: -39, date: "Ontem" },
  { id: "8", title: "Netflix", amount: -39, date: "Ontem" },
  { id: "9", title: "Mercado", amount: -120, date: "Hoje" },
  { id: "10", title: "Netflix", amount: -39, date: "Ontem" },
];

  console.log(token);
  return (
    <div className="flex flex-col gap-6 w-10/10">
      <div className="grid grid-cols-2 h-16 text-black justify-between">
        <div>
          <h2 className="text-2xl">Olá, Lucas!</h2>
        </div>
        <div className="flex justify-end w-2/2 gap-2">
            <div className="flex flex-col justify-center rounded-xl border-2 border-(--color-border) w-3/12 h-10 shadow-lg cursor-pointer">
              <h3 className="text-center text-(--color-text-secondary)">
                Principal 🟢
              </h3>
            </div>
            <div className="flex flex-col relative justify-center border-2 border-(--color-border) rounded-full w-12 h-12 shadow-lg cursor-pointer">
              <User className="top-2/4 translate-x-5/12"/>
            </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <ValueCard title="Entradas" value="R$25.000,00" icon={<DollarSign className="text-(--color-positive)"/>} textColor="text-(--color-positive)" bgColor="bg-(--color-surface)" iconBgColor="bg-(--color-positive)/20"/>
        <ValueCard title="Saídas" value="R$10.000,00" icon={<ArrowDownLeft className="text-(--color-alert)"/>} textColor="text-(--color-alert)" bgColor="bg-(--color-surface)" iconBgColor="bg-(--color-alert)/20"/>
        <ValueCard title="Contas a Pagar" value="R$5.000,00" icon={<Banknote className="text-(--color-middle-alert)"/>} textColor="text-(--color-middle-alert)" bgColor="bg-(--color-surface)" iconBgColor="bg-(--color-middle-alert)/20"/>
        <ValueCard title="Saldo do Mês" value="R$10.000,00" icon={<Wallet className="text-(--color-neutral-alert)"/>} textColor="text-(--color-neutral-alert)" bgColor="bg-(--color-surface)" iconBgColor="bg-(--color-neutral-alert)/20"/>
      </div>
      <div className="grid grid-cols-[1.2fr_0.8fr] gap-4 max-h-[480]">
        <div className="grid grid-rows-2 gap-4 h-8/12">
          <div className="h-10/10 border-2 border-(--color-border) rounded-xl shadow-lg">
            <GradificoDoughnut />
          </div>
          <div className="h-10/10 border-2 border-(--color-border) rounded-xl shadow-l">
            <Grafico />
          </div>
        </div>
        <div className="border-2 border-(--color-border) rounded-xl shadow-l h-8/12 overflow-y-auto">
          <div className="flex justify-start pt-3 px-3 ml-4">
            <span className="text-md text-(--color-text-primary) h-10/10 font-semibold">Últimas transações</span>
          </div>
          <TransactionList data={transactions}/>
        </div>
      </div>
    </div>
  );
};