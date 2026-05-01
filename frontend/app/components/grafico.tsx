"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Grafico() {
  const data = [
    { name: "Jan", valor: 13470 },
    { name: "Fev", valor: 13162 },
    { name: "Mar", valor: 13015 },
    { name: "Abr", valor: 3000 },
    { name: "Mai", valor: 8010 },
    { name: "Jun", valor: 13290 },
    { name: "Jul", valor: 13146 },
    { name: "Ago", valor: 10260 },
    { name: "Set", valor: 14164 },
    { name: "Out", valor: 14279 },
    { name: "Nov", valor: 14650 },
    { name: "Dez", valor: 19892 },
  ];

  return (
    <div className="bg-white p-4 rounded-2xl shadow-lg w-full h-full border-2 border-[#EDEDED]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="valor" stroke="#5260BA" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}