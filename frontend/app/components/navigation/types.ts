import { LucideIcon } from "lucide-react";

export type NavItem = {
    href: string;
    slug?: string;
    icon?: LucideIcon;
    label: string;
};