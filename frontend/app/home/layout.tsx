"use client";

import { useRouter } from "next/navigation";
import SideNav from "../components/navigation/SideNav";
import TopBar from "../components/navigation/TopBar";
import BottomNav from "../components/navigation/BottomNav";
import { useEffect, useState } from "react";
import { me } from "@/services/auth";

export default function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    const router = useRouter();
    const [authStatus, setAuthStatus] = useState<
        "checking" | "authenticated" | "unauthenticated"
    >("checking");

    useEffect(() => {
        let cancelled = false;

        me()
            .then((res) => {
                if (cancelled) return;
                setAuthStatus(res.ok ? "authenticated" : "unauthenticated");
            })
            .catch(() => {
                if (cancelled) return;
                setAuthStatus("unauthenticated");
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (authStatus === "unauthenticated") {
            router.replace("/login");
        }
    }, [authStatus, router]);

    if (authStatus !== "authenticated") {
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
                <main
                    id="main"
                    className="flex-1 p-4 sm:p-6 overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom))] lg:pb-6"
                    tabIndex={-1}
                >
                    <div className="mx-auto w-full max-w-5xl">
                        {children}
                    </div>
                </main>
                <BottomNav />
            </div>
        </div>
    );
}
