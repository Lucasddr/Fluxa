"use client";

import ThemeToggle from "../ui/ThemeToggle";

export default function TopBar() {
  return (
    <header
      style={{ viewTransitionName: "topbar" }}
      className="lg:hidden sticky top-0 z-40 border-b border-line bg-paper"
    >
      <div className="flex items-center justify-between px-4 min-h-[56px]">
        <p className="text-[17px] font-medium tracking-tight text-ink">
          Opsire
        </p>

        <ThemeToggle />
      </div>
    </header>
  );
}
