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
    {label}
    </Link>
);
}