
import { ChartPie, ArrowLeftRight, Tag, CreditCard } from "lucide-react";
import type { NavItem } from "./types";

export const navItems : NavItem[] = [ 
    {
        href: "/home/dashboard",
        slug: "dashboard", 
        icon: ChartPie,
        label: "Dashboard"
    },
    {
        href: "/home/transactions",
        slug: "transactions", 
        icon: ArrowLeftRight,
        label: "Transações"
    },
    {
        href: "/home/categories",
        slug: "categories", 
        icon: Tag,
        label: "Categorias"
    },
    {
        href: "/home/accounts",
        slug: "accounts", 
        icon: CreditCard,
        label: "Contas"
    },
]