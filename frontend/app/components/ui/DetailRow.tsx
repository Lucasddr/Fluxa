"use client";

type DetailRowProps = {
  label: string;
  value: string;
};

export default function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-line last:border-0">
      <span className="text-sm text-ink-3">
        {label}
      </span>

      <span className="text-sm text-ink text-right">
        {value}
      </span>
    </div>
  );
}
