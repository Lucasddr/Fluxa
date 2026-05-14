"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

type AppLinkProps = {
href: string;
slug?: string;
children: ReactNode;
icon?: LucideIcon;
};

export default function AppLink({
href,
slug,
children,
icon: Icon,
}: AppLinkProps) {
const segment = useSelectedLayoutSegment();

const isActive = slug
    ? segment === slug
    : segment === null;

return (
    <Link
    href={href}
    className={`
        flex items-center gap-2 px-3 py-2 rounded-lg transition
        ${
        isActive
            ? "bg-(--color-surface-active) text-(--color-interactive)"
            : "text-white hover:bg-(--color-surface-active) hover:text-(--color-interactive)"
        }
    `}
    >
    {Icon && <Icon className="w-4 h-4" />}
    {children}
    </Link>
);
}