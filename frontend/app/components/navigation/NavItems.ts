
import { ChartPie, ArrowLeftRight, Tag, CreditCard, Wallet } from "lucide-react";
import type { NavItem } from "./types";

export const navItems : NavItem[] = [ 
    {
        href: "/home/dashboard",
        slug: "dashboard", 
        icon: ChartPie,
        label: "Dashboard",
        mobileLabel: "Início"
    },
    {
        href: "/home/transactions",
        slug: "transactions", 
        icon: ArrowLeftRight,
        label: "Transações",
        mobileLabel: "Movim."
    },
    {
        href: "/home/bank-accounts",
        slug: "bank-accounts",
        icon: Wallet,
        label: "Bancos",
        mobileLabel: "Bancos"
    },
    {
        href: "/home/categories",
        slug: "categories", 
        icon: Tag,
        label: "Categorias",
        mobileLabel: "Categ."
    },
    {
        href: "/home/accounts",
        slug: "accounts", 
        icon: CreditCard,
        label: "Parcelas",
        mobileLabel: "Parcelas"
    },
]
