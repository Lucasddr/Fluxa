"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LucideIcon } from "lucide-react";

type MenuAction = {
        label: string;
        icon: LucideIcon;
        onClick: () => void;
        danger?: boolean;
    };

    type MenuListModalProps = {
        actions: MenuAction[];
        trigger: React.ReactNode;
    };

    export default function MenuListModal({
    actions,
    trigger,
    }: MenuListModalProps) {
    return (
        <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>

        <DropdownMenu.Portal>
            <DropdownMenu.Content
            align="end"
            sideOffset={4}
            collisionPadding={8}
            className="min-w-48 bg-paper border border-line rounded-[var(--radius)] overflow-hidden z-50"
            >
            {actions.map((action) => {
                const Icon = action.icon;

                return (
                <DropdownMenu.Item
                    key={action.label}
                    onSelect={action.onClick}
                    className={`
                    flex items-center gap-3 px-4 min-h-[44px] text-sm cursor-pointer outline-none transition-colors duration-[var(--dur-fast)]
                    ${
                        action.danger
                        ? "text-negative data-[highlighted]:bg-surface"
                        : "text-ink-2 data-[highlighted]:text-ink data-[highlighted]:bg-surface"
                    }
                    `}
                >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{action.label}</span>
                </DropdownMenu.Item>
                );
            })}
            </DropdownMenu.Content>
        </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}