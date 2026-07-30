"use client";

import SideNav from "../components/navigation/SideNav";

export default function HomeLayout({
children,
}: {
children: React.ReactNode;
}) {
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