
import { ChartPie, ArrowLeftRight, Tag } from "lucide-react";
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
]