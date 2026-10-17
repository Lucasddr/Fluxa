import type { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  title = "Nada por aqui ainda",
  description = "Quando houver dados, eles aparecerão aqui.",
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 px-6 py-12 text-center ${className}`}
    >
      <p className="text-sm text-ink font-medium">{title}</p>
      <p className="text-sm text-ink-2 max-w-xs">{description}</p>
      {action}
    </div>
  );
}
