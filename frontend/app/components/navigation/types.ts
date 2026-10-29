import { LucideIcon } from "lucide-react";

export type NavItem = {
    href: string;
    slug?: string;
    icon?: LucideIcon;
    label: string;
    mobileLabel?: string;
};

/**
 * Ordem canônica das seções no app. Navegar para uma seção de índice
 * maior desliza "para frente" (esquerda); para índice menor, "para trás"
 * (direita) — ver NavLink/BottomNav e ::view-transition-* no globals.css.
 */
export const navOrder: string[] = [
    "dashboard",
    "transactions",
    "bank-accounts",
    "categories",
    "accounts",
    "configurations",
];
