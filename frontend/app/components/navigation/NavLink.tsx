"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { navOrder, type NavItem } from "./types";

export default function NavLink({
  href,
  slug,
  icon: Icon,
  label,
}: NavItem) {
  const segment = useSelectedLayoutSegment();

  const isActive = slug ? segment === slug : segment === null;

  // Direção da transição de página: seção de índice maior desliza para
  // frente (esquerda), menor volta para trás (direita). Mesma posição
  // ou origem desconhecida: sem tipo (cai no fade default).
  const targetIndex = slug ? navOrder.indexOf(slug) : -1;
  const currentSegment = segment ?? (isActive ? "dashboard" : null);
  const currentIndex = currentSegment ? navOrder.indexOf(currentSegment) : -2;
  const transitionTypes =
    currentIndex === -2 || targetIndex === -1 || currentIndex === targetIndex
      ? undefined
      : targetIndex > currentIndex
        ? "nav-forward"
        : "nav-back";

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      transitionTypes={transitionTypes ? [transitionTypes] : undefined}
      className={`flex items-center gap-3 px-3 min-h-[44px] rounded-[var(--radius)] text-[15px] transition-colors duration-[var(--dur-fast)]
        ${
          isActive
            ? "bg-ink text-paper font-medium"
            : "text-ink-2 hover:text-ink hover:bg-line-subtle"
        }
      `}
    >
      {Icon && <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden />}
      {label}
    </Link>
  );
}
