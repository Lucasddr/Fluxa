"use client";

type DetailRowProps = {
  label: string;
  value: string;
};

export default function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-400">
        {label}
      </span>

      <span className="text-sm font-medium text-gray-800 text-right">
        {value}
      </span>
    </div>
  );
}
