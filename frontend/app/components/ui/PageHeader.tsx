import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-light tracking-tight text-ink">
          {title}
        </h1>

        {subtitle && (
          <p className="text-sm text-ink-3 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}
