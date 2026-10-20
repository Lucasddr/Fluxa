import { ChevronDown } from "lucide-react";
import { useId } from "react";
import type { SelectHTMLAttributes, ReactNode } from "react";
import FieldError from "./FieldError";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  children: ReactNode;
}

export default function Select({
  error,
  children,
  id,
  className = "",
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: SelectProps) {
  const generatedId = useId().replace(/:/g, "");
  const selectId = id ?? `select-${generatedId}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(" ");

  return (
    <>
      <div className="relative min-w-0">
        <select
          id={selectId}
          className={`
            w-full appearance-none
            pl-3.5 pr-9 min-h-[48px]
            rounded-[var(--radius)] border
            text-sm bg-surface text-ink
            focus:outline-none focus:border-ink focus:shadow-[0_0_0_3px_var(--focus-ring)]
            transition-colors duration-[var(--dur-fast)]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-negative" : "border-line-strong"}
            ${className}
          `}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={describedBy || undefined}
          {...props}
        >
          {children}
        </select>

        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none"
          aria-hidden
        />
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </>
  );
}
