"use client";

import { ArrowLeftRight, Home, Receipt, Settings, Tag } from "lucide-react";
import AppLink from "../components/AppLink";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen bg-white font-sans">

      {/* Sidebar */}
      <aside className="w-60 bg-(--color-primary) text-white p-5 flex flex-col justify-between">
        <div>
          <h2 className="mb-5 text-lg font-semibold tracking-wide">Fluxa</h2>

          <nav className="flex flex-col gap-2.5">
            <AppLink href="/home/dashboard"     icon={Home}          slug="dashboard">    Dashboard    </AppLink>
            <AppLink href="/home/transactions"  icon={ArrowLeftRight} slug="transactions"> Transações   </AppLink>
            <AppLink href="/home/reports"       icon={Receipt}       slug="reports">      Relatórios   </AppLink>
            <AppLink href="/home/categorias"    icon={Tag}           slug="categorias">   Categorias   </AppLink>
          </nav>
        </div>

        <div>
          <AppLink href="/home/configurations" icon={Settings} slug="configurations">Configurações</AppLink>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-y-auto bg-(--background)">
        {children}
      </main>
    </div>
  );
}
