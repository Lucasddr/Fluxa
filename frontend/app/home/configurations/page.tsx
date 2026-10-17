"use client";

import Link from "next/link";
import { ChevronRight, Moon, Sun } from "lucide-react";

import PageHeader from "@/app/components/ui/PageHeader";
import { useTheme } from "@/app/components/ui/ThemeProvider";

// ─── page ──────────────────────────────────────────────────────

export default function ConfigurationsPage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Configurações"
        subtitle="Personalize sua experiência no Fluxa."
      />

      <section className="rounded-[var(--radius)] border border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Aparência</h2>
          <p className="text-xs text-ink-3">
            A preferência é salva neste dispositivo.
          </p>
        </div>

        <div
          className="grid grid-cols-2 gap-3 p-5"
          role="group"
          aria-label="Tema de aparência"
        >
          {[
            { value: "light", label: "Claro", Icon: Sun },
            { value: "dark", label: "Escuro", Icon: Moon },
          ].map(({ value, label, Icon }) => {
            const selected = theme === value;

            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  if (!selected) toggle();
                }}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius)] border px-3 text-sm font-medium transition-colors ${
                  selected
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink hover:bg-line-subtle"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[var(--radius)] border border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Segurança</h2>
          <p className="text-xs text-ink-3">
            Solicite um link para redefinir sua senha.
          </p>
        </div>

        <Link
          href="/forgot-password"
          className="flex min-h-14 items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-ink transition-colors hover:bg-line-subtle"
        >
          Receber link para redefinir senha
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
