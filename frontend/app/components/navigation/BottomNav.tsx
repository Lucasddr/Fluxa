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
      <div className="grid grid-cols-5 items-center">
        {navItems.map(({ href, slug, icon: Icon, label, mobileLabel }) => {
          const isActive = segment === slug;

          return (
            <Link
              key={slug}
              href={href}
              aria-label={mobileLabel ? `${mobileLabel}, ${label}` : label}
              aria-current={isActive ? "page" : undefined}
              className={`flex w-full min-w-0 flex-col items-center justify-center gap-1 min-h-[56px] px-0.5 text-[10px] font-medium transition-colors duration-[var(--dur-fast)] sm:px-2 sm:text-[11px] ${
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
              <span className="hidden max-w-full truncate leading-none sm:inline">{label}</span>
              <span className="max-w-full truncate leading-none sm:hidden">{mobileLabel ?? label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
