"use client";

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-12">
      <p role="alert" className="text-sm text-negative text-center">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="px-5 min-h-[44px] rounded-[var(--radius)] text-sm font-medium text-accent-ink bg-accent transition-opacity disabled:opacity-40"
      >
        Tentar novamente
      </button>
    </div>
  );
}
