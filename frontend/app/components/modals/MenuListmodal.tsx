"use client";

import { LucideIcon } from "lucide-react";

type MenuAction = {
label: string;
icon: LucideIcon;
onClick: () => void;
danger?: boolean;
};

type MenuListModalProps = {
actions: MenuAction[];
};

export default function MenuListModal({
actions,
}: MenuListModalProps) {
return (
    <div className="absolute right-0 top-full mt-2 min-w-48 bg-white border border-(--color-border) rounded-xl shadow-lg overflow-hidden z-50">

    {actions.map((action) => {
        const Icon = action.icon;

        return (
        <button
            key={action.label}
            onClick={action.onClick}
            className={`
            w-full flex items-center gap-3 px-4 py-3 text-(--color-text-primary) text-sm text-left
            hover:bg-(--color-surface-secondary) transition-colors
            ${
                action.danger
                ? "text-red-600 hover:bg-red-200 transition-colors"
                : "text-gray-700"
            }
            `}
        >
            <Icon className="w-4 h-4 shrink-0" />

            <span>{action.label}</span>
        </button>
        );
    })}
    </div>
);
}