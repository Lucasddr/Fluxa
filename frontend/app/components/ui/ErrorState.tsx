"use client";

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12">
      <p role="alert" className="text-sm text-red-600 text-center">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition hover:brightness-110"
        style={{
          backgroundColor: "var(--color-interactive)",
        }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
