import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes, ReactNode } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  children: ReactNode;
}

export default function Select({
  error,
  children,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="relative min-w-0">
      <select
        className={`
          w-full appearance-none
          pl-3.5 pr-9 min-h-[48px]
          rounded-[var(--radius)] border
          text-sm bg-surface text-ink
          focus:outline-none focus:border-ink-3
          transition-colors duration-[var(--dur-fast)]
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? "border-negative" : "border-line"}
          ${className}
        `}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {children}
      </select>

      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none"
        aria-hidden
      />
    </div>
  );
}
