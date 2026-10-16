"use client";

import { useRouter } from "next/navigation";
import SideNav from "../components/navigation/SideNav";
import TopBar from "../components/navigation/TopBar";
import { useEffect, useState } from "react";
import { me } from "@/services/auth";

export default function HomeLayout({
children,
}: {
children: React.ReactNode;
}) {

    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            try{
                const res = await me();
                if(!res.ok) {
                    router.replace("/login");
                    return;
                }
                setChecking(false);
            }   catch {
                router.replace("/login")
            }
        }
        checkAuth();
    }, [router]);

    if (checking) {
        return (
            <div className="flex h-dvh w-screen items-center justify-center bg-paper">
                <p className="text-ink-2" role="status">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-dvh w-screen bg-paper font-sans text-ink">
            <SideNav className="hidden lg:flex" />
            <div className="flex-1 flex flex-col min-w-0">
                <TopBar />
                {/* Main */}
                <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                    <div className="mx-auto w-full max-w-5xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}