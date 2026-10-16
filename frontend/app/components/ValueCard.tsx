type ValueCardProps = {
  title: string;
  value: string | number;
  tone?: "ink" | "positive" | "negative" | "warn";
};

const TONE_CLASS: Record<NonNullable<ValueCardProps["tone"]>, string> = {
  ink: "text-ink",
  positive: "text-positive",
  negative: "text-negative",
  warn: "text-warn",
};

export default function ValueCard({
  title,
  value,
  tone = "ink",
}: ValueCardProps) {
  return (
    <div className="border-t border-line pt-3">
      <p className="text-[13px] text-ink-3">{title}</p>

      <p
        className={`mt-1 text-[28px] leading-none font-light tracking-tight tabular-nums ${TONE_CLASS[tone]}`}
      >
        {value}
      </p>
    </div>
  );
}
