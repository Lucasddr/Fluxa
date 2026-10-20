"use client";

import type { InputHTMLAttributes } from "react";
import Input from "./Input";

type CurrencyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> & {
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
};

export function formatBrlInput(raw: string): string {
  const negative = raw.trimStart().startsWith("-");
  const cleaned = raw.replace(/[^\d,]/g, "");
  if (!cleaned) return negative ? "-" : "";

  const [rawInteger, ...rest] = cleaned.split(",");
  const integerDigits = rawInteger.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  const integerPart = integerDigits
    ? integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    : "0";

  if (rest.length === 0) {
    return `${negative ? "-" : ""}${integerPart}`;
  }

  const decimals = rest.join("").replace(/\D/g, "").slice(0, 2);
  return `${negative ? "-" : ""}${integerPart},${decimals}`;
}

export function formatAmountValue(amount: number): string {
  if (!Number.isFinite(amount)) return "";
  const formatted = Math.abs(amount).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? "-" : ""}${formatted}`;
}

export default function CurrencyInput({
  value,
  onValueChange,
  error,
  className = "",
  ...props
}: CurrencyInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={value}
      error={error}
      className={`text-right tabular-nums ${className}`}
      onChange={(event) => onValueChange(formatBrlInput(event.target.value))}
    />
  );
}
