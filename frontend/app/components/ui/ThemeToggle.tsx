"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"
      }
      aria-pressed={theme === "dark"}
      className="flex items-center justify-center w-11 h-11 rounded-[var(--radius)] border border-line text-ink-2 transition-colors duration-[var(--dur-fast)] hover:text-ink hover:border-ink-3"
    >
      {theme === "light" ? (
        <Moon className="w-[18px] h-[18px]" />
      ) : (
        <Sun className="w-[18px] h-[18px]" />
      )}
    </button>
  );
}
