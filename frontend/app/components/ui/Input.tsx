import type { InputHTMLAttributes } from "react";
import { useId } from "react";
import FieldError from "./FieldError";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export default function Input({
  error,
  id,
  className = "",
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: InputProps) {
  const generatedId = useId().replace(/:/g, "");
  const inputId = id ?? `input-${generatedId}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(" ");

  return (
    <>
      <input
        id={inputId}
        className={`
          w-full px-3.5 min-h-[48px]
          rounded-[var(--radius)] border
          text-[15px] text-ink bg-surface
          placeholder:text-ink-3
          focus:outline-none focus:border-ink-3
          transition-colors duration-[var(--dur-fast)]
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? "border-negative" : "border-line"}
          ${className}
        `}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={describedBy || undefined}
        {...props}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </>
  );
}
