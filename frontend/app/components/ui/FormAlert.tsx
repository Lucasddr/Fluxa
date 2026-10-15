"use client";

import type { ReactNode } from "react";

type FormAlertProps = {
  children: ReactNode;
};

export default function FormAlert({ children }: FormAlertProps) {
  return (
    <p
      role="alert"
      className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
    >
      {children}
    </p>
  );
}
