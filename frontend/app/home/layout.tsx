"use client";

import { useRouter } from "next/navigation";
import SideNav from "../components/navigation/SideNav";
import { useEffect, useState } from "react";
import { api } from "@/services/api";

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
                const res = await api("/auth/me");
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
            <div className="flex h-screen w-screen items-center justify-center">
                <p className="text-teal-700">Carregando...</p>
            </div>
        );
    }
    
    return (
        <div className="flex h-screen w-screen bg-white font-sans">
            
                <SideNav className="hidden lg:flex"/>
            {/* Main */}
            <main className="flex-1 p-6 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}