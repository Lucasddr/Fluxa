"use client";

import { ArrowLeftRight, Home, Receipt, Settings, Tag } from "lucide-react";

import AppLink from "../components/AppLink";

export default function HomeLayout({
children,
}: {
children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-screen bg-white font-sans">
            
            {/* Sidebar */}
            <aside className="w-60 bg-(--color-primary) text-white p-5 flex flex-col justify-between">
                <h2 className="mb-5">Fluxa</h2>
                
                <nav className="flex flex-col gap-2.5 align-middle">
                    <AppLink href="/home/dashboard" icon={Home} slug="dashboard"> Dashboard </AppLink>
                    <AppLink href="/home/transactions" icon={ArrowLeftRight} slug="transactions"> Transações </AppLink>
                    <AppLink href="/home/categories" icon={Tag}  slug="categories">   Categorias   </AppLink>
                {/* <AppLink href="/home/reports" icon={Receipt} slug="reports">Relatórios</AppLink> */} {/*Retirar comentário quando a página de reports estiver pronta*/}
                </nav>

                <div>
                    {/*<AppLink href="/home/configurations" icon={Settings} slug="configurations">Configurações</AppLink>*/}
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 p-6 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}