import { ChevronDown } from "lucide-react";
import Select from "./Select";

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  fullWidth?: boolean;
  label?: string;
  className?: string;
}

export default function FilterSelect({
  value,
  onChange,
  children,
  fullWidth = false,
  label,
  className = "",
}: FilterSelectProps) {
  return (
    <div className={`relative min-w-0 ${fullWidth ? "w-full sm:w-auto" : ""} ${className}`}>
      {label && (
        <span className="sr-only">{label}</span>
      )}

      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label ?? "Filtro"}
        className={fullWidth ? "w-full sm:w-auto" : ""}
      >
        {children}
      </Select>

      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none"
        aria-hidden
      />
    </div>
  );
}
