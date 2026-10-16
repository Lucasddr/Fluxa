"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import type { NavItem } from "./types";

export default function NavLink({
  href,
  slug,
  icon: Icon,
  label,
}: NavItem) {
  const segment = useSelectedLayoutSegment();

  const isActive = slug ? segment === slug : segment === null;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 px-3 min-h-[44px] rounded-[var(--radius)] text-[15px] transition-colors duration-[var(--dur-fast)]
        ${
          isActive
            ? "bg-ink text-paper font-medium"
            : "text-ink-2 hover:text-ink hover:bg-surface"
        }
      `}
    >
      {Icon && <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden />}
      {label}
    </Link>
  );
}
