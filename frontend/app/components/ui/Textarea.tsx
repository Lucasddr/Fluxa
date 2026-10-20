import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export default function Textarea({
  error,
  className = "",
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={`
        w-full px-3.5 py-2.5
        rounded-[var(--radius)] border
        text-[15px] text-ink bg-surface resize-none
        placeholder:text-ink-3
        focus:outline-none focus:border-ink focus:shadow-[0_0_0_3px_var(--focus-ring)]
        transition-colors duration-[var(--dur-fast)]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error ? "border-negative" : "border-line-strong"}
        ${className}
      `}
      aria-invalid={error ? true : undefined}
      {...props}
    />
  );
}
