import type { LabelHTMLAttributes, ReactNode } from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  optional?: boolean;
}

export default function Label({
  children,
  optional,
  className = "",
  ...props
}: LabelProps) {
  return (
    <label
      className={`block text-sm text-ink-2 mb-1.5 ${className}`}
      {...props}
    >
      {children}
      {optional && (
        <span className="text-ink-3 font-normal ml-1">(opcional)</span>
      )}
    </label>
  );
}
