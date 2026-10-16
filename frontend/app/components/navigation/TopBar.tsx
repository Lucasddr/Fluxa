"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { navItems } from "./NavItems";
import ThemeToggle from "../ui/ThemeToggle";

export default function TopBar() {
  const segment = useSelectedLayoutSegment();

  return (
    <header className="lg:hidden sticky top-0 z-40 border-b border-line bg-paper">
      <div className="flex items-center justify-between px-4 min-h-[56px]">
        <p className="text-[17px] font-medium tracking-tight text-ink">
          Fluxa
        </p>

        <ThemeToggle />
      </div>

      <nav
        aria-label="Principal"
        className="flex gap-1 overflow-x-auto px-3 pb-2"
      >
        {navItems.map(({ href, slug, label }) => {
          const isActive = segment === slug;

          return (
            <Link
              key={slug}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`shrink-0 px-4 min-h-[44px] inline-flex items-center rounded-[var(--radius)] text-sm transition-colors duration-[var(--dur-fast)]
                ${
                  isActive
                    ? "bg-ink text-paper font-medium"
                    : "text-ink-2 hover:text-ink"
                }
              `}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
