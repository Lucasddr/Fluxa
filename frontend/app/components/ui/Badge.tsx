import type { ReactNode } from "react";

type BadgeVariant = "default" | "positive" | "negative" | "warn" | "neutral";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface text-ink border border-line",
  positive: "bg-positive-subtle text-positive border border-positive/20",
  negative: "bg-negative-subtle text-negative border border-negative/20",
  warn: "bg-warn-subtle text-warn border border-warn/20",
  neutral: "bg-line-subtle text-ink-2 border border-line",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1
        px-2.5 py-1 rounded-full
        text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
