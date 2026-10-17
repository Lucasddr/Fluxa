"use client";

import type { ReactNode } from "react";

type FormAlertProps = {
  children: ReactNode;
};

export default function FormAlert({ children }: FormAlertProps) {
  return (
    <p
      role="alert"
      className="text-sm text-negative border border-negative/40 rounded-[var(--radius)] px-3.5 py-2.5"
    >
      {children}
    </p>
  );
}
