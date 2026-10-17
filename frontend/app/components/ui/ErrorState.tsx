"use client";

import { AlertCircle } from "lucide-react";
import Button from "./Button";

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-12">
      <div className="flex items-center gap-2 text-negative">
        <AlertCircle className="w-4 h-4" aria-hidden />
        <p role="alert" className="text-sm text-center">
          {message}
        </p>
      </div>

      <Button onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}
