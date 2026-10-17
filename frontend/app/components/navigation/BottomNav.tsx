"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { navItems } from "./NavItems";

export default function BottomNav() {
  const segment = useSelectedLayoutSegment();

  return (
    <nav
      aria-label="Principal"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around">
        {navItems.map(({ href, slug, icon: Icon, label }) => {
          const isActive = segment === slug;

          return (
            <Link
              key={slug}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 min-h-[56px] min-w-[64px] px-2 text-[11px] font-medium transition-colors duration-[var(--dur-fast)] ${
                isActive
                  ? "text-ink"
                  : "text-ink-3 hover:text-ink-2"
              }`}
            >
              {Icon && (
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? "stroke-[2.5px]" : "stroke-[2px]"
                  }`}
                  aria-hidden
                />
              )}
              <span className="leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
