"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

type AppDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: AppDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius)] bg-paper border border-line focus:outline-none">
          <div className="flex shrink-0 items-center justify-between gap-4 px-6 pt-6 pb-4 border-b border-line">
            <div className="min-w-0">
              <Dialog.Title className="min-w-0 break-words text-lg font-medium tracking-tight text-ink">
                {title}
              </Dialog.Title>

              <Dialog.Description className="break-words text-sm text-ink-3 mt-0.5">
                {description}
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fechar"
                className="shrink-0 flex items-center justify-center w-11 h-11 rounded-[var(--radius)] text-ink-2 transition-colors duration-[var(--dur-fast)] hover:text-ink hover:bg-line-subtle"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
            {children}
          </div>

          {footer ? (
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
