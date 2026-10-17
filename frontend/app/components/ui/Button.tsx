import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  asChild?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-ink hover:bg-accent-hover active:scale-[0.98]",
  secondary:
    "bg-surface text-ink border border-line hover:border-ink-3 hover:text-ink active:bg-line-subtle",
  danger:
    "bg-negative text-white hover:opacity-90 active:scale-[0.98]",
  ghost:
    "bg-transparent text-ink-2 hover:text-ink hover:bg-line-subtle active:bg-line",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-[36px] px-3 text-sm rounded-[var(--radius-sm)]",
  md: "min-h-[44px] px-5 text-sm rounded-[var(--radius)]",
  lg: "min-h-[48px] px-6 text-base rounded-[var(--radius)]",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  asChild = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      type={asChild ? undefined : props.type ?? "button"}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium
        transition-all duration-[var(--dur-fast)] ease-[var(--ease)]
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && (
            <span
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
          )}
          {children}
        </>
      )}
    </Comp>
  );
}
