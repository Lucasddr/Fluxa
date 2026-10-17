"use client";

import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "success" | "error";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastContextValue = {
  toast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error("useToast fora de um ToasterProvider");
  }

  return ctx;
}

export default function ToasterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "success") => {
      const id = ++idRef.current;

      setToasts((prev) => [...prev.slice(-2), { id, kind, message }]);

      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div
        aria-live="polite"
        className="fixed bottom-4 left-1/2 z-[70] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`flex items-center justify-between gap-3 rounded-[var(--radius)] border px-4 py-3 text-sm font-medium shadow-md transition-all duration-[var(--dur)] ease-[var(--ease-out)] ${
              t.kind === "error"
                ? "bg-negative-subtle border-negative/30 text-negative"
                : "bg-ink border-ink text-paper"
            }`}
          >
            <span>{t.message}</span>

            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Fechar notificação"
              className="shrink-0 p-1 rounded-[var(--radius-sm)] opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
