import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export default function Input({ error, className = "", ...props }: InputProps) {
  return (
    <input
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
      aria-invalid={error ? true : undefined}
      {...props}
    />
  );
}
