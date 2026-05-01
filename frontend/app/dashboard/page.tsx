"use client";

import Card from "../components/card";
import Grafico from "../components/grafico";

export default function DashboardPage() {
  const token = "fluxa_token_123456";

  console.log(token);
  return (
    <div className="flex flex-col gap-10 w-10/10">
      <div className="flex flex-col h-24 text-black justify-center">
        <h2 className="text-2xl">Olá, Lucas!</h2>
      </div>
      <div className="grid grid-cols-4 gap-4 w-10/10 h-22">
        <Card title="Saldo" value="R$25.000,00" />
        <Card title="Movimentações" value="25 hoje." />
        <Card title="API Status" value="🟢Online" />
        <Card title="Login" value="Lucas" />
      </div>
      <div className="grid grid-cols-[1.2fr_0.8fr] w-10/10 h-58 gap-4">
        <Grafico/>
        <Card title="Lista" value="Lista muito foda" />
      </div>
    </div>
  );
};