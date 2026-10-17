"use client";

import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

type FormAlertProps = {
  children: ReactNode;
};

export default function FormAlert({ children }: FormAlertProps) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 text-sm text-negative border border-negative/30 bg-negative-subtle rounded-[var(--radius)] px-3.5 py-2.5"
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
