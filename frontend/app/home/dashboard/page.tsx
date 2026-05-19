"use client";

import ValueCard from "@/app/components/ValueCard";
import Grafico from "@/app/components/Grafico";
import GraficoDonut from "@/app/components/GraficoDonut";
import TransactionList from "@/app/components/TransactionList";
import { ArrowDownLeft, Banknote, DollarSign, User, Wallet } from 'lucide-react';
import { api } from "@/services/api";

type DashboardDTO = {
  user : string;
  accountName: string;
  entry : number;
  expenses : number;
  accountsPayable : number;
  monthlyBalance : number;
}

type Transaction = {
    id: string;
    amount: number;
    title: string;
    kind: "EXPENSE" | "INCOME";
    date: string;
    account: string;
    categoryName: string;
}

type PageResponse<Transaction> = {
    content: Transaction[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

const start = "2026-04-01"
const end = "2026-05-30"

const response = await api(`/dashboard/buildDashboard?start=${start}&end=${end}`);
const transactionListResponse = await api("/dashboard/recentTransactions");


const cardsData : DashboardDTO = await response.json();
const transactionList : PageResponse<Transaction> = await transactionListResponse.json();

export default function DashboardPage() {

  console.log(localStorage.getItem("token"));
  return (
    <div className="flex flex-col gap-6 w-10/10">
      <div className="grid grid-cols-2 h-16 text-black justify-between">
        <div>
          <h2 className="text-2xl"> Olá, {cardsData.user}!</h2>
        </div>
        <div className="flex justify-end w-2/2 gap-2">
            <div className="flex flex-col justify-center rounded-xl border-2 border-(--color-border) w-3/12 h-10 shadow-lg cursor-pointer">
              <h3 className="text-center text-(--color-text-secondary)">
                {cardsData.accountName} 🟢
              </h3>
            </div>
            <div className="flex flex-col relative justify-center border-2 border-(--color-border) rounded-full w-12 h-12 shadow-lg cursor-pointer">
              <User className="top-2/4 translate-x-5/12"/>
            </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <ValueCard title="Saldo do Mês" value={cardsData.monthlyBalance} icon={<Wallet className="text-(--color-neutral-alert)"/>} textColor="text-(--color-neutral-alert)" bgColor="bg-(--color-surface)" iconBgColor="bg-(--color-neutral-alert)/20"/>
        <ValueCard title="Entradas" value={cardsData.entry} icon={<DollarSign className="text-(--color-positive)"/>} textColor="text-(--color-positive)" bgColor="bg-(--color-surface)" iconBgColor="bg-(--color-positive)/20"/>
        <ValueCard title="Saídas" value={cardsData.expenses} icon={<ArrowDownLeft className="text-(--color-alert)"/>} textColor="text-(--color-alert)" bgColor="bg-(--color-surface)" iconBgColor="bg-(--color-alert)/20"/>
        <ValueCard title="Contas a Pagar" value={cardsData.accountsPayable} icon={<Banknote className="text-(--color-middle-alert)"/>} textColor="text-(--color-middle-alert)" bgColor="bg-(--color-surface)" iconBgColor="bg-(--color-middle-alert)/20"/>
      </div>
      <div className="grid grid-cols-[1.2fr_0.8fr] gap-4 max-h-[480] min-h-[480]">
        <div className="grid grid-rows-2 gap-4">
          <div className="h-10/10 border-2 border-(--color-border) rounded-xl shadow-lg">
            <GraficoDonut entry= {cardsData.entry} expenses = {cardsData.expenses} accountsPayable = {cardsData.accountsPayable}/>
          </div>
          <div className="h-10/10 border-2 border-(--color-border) rounded-xl shadow-l">
            <Grafico />
          </div>
        </div>
        <div className="border-2 border-(--color-border) rounded-xl shadow-lg overflow-y-auto">
          <div className="flex justify-start pt-3 px-3 ml-4">
            <span className="text-md text-(--color-text-primary) h-10/10 font-semibold/">Últimas transações</span>
          </div>
          <TransactionList data={transactionList.content}/>
        </div>
      </div>
    </div>
  );
};