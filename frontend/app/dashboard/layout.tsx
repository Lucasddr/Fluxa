"use client";

import Link from "next/link";

export default function DashboardLayout({
children,
}: {
children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-screen bg-white font-sans">
            
            {/* Sidebar */}
            <aside className="w-60 bg-[#0f2d3f] text-white p-5 flex flex-col justify-between">
                <h2 className="mb-5">Fluxa</h2>

                <nav className="flex flex-col gap-2.5 align-middle">
                    <Link href="/dashboard"> Dashboard </Link>
                    <Link href="/dashboard/transactions"> Transações </Link>
                    <a href="#">Relatórios</a>
                    <a href="#">Configurações</a>
                </nav>

                <div>

                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    );
}