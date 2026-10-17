"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { forgotPassword } from "@/services/auth";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Label from "@/app/components/ui/Label";
import FormAlert from "@/app/components/ui/FormAlert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailError = touched && !emailValid;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setTouched(true);

    if (!emailValid) return;

    setLoading(true);

    try {
      const res = await forgotPassword(email.trim().toLowerCase());

      if (!res.ok) {
        setErrorMessage("Erro ao enviar. Tente novamente mais tarde.");
        return;
      }

      setSent(true);
    } catch {
      setErrorMessage("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-paper text-ink px-4 py-10">
      <main id="main" className="w-full max-w-sm" tabIndex={-1}>
        <p className="text-center text-[13px] text-ink-3 mb-2">
          Fluxa
        </p>

        <h1 className="text-center text-3xl font-light tracking-tight mb-2">
          Esqueci minha senha
        </h1>

        <p className="text-sm text-ink-2 text-center mb-8">
          Digite seu e-mail para receber o link de recuperação.
        </p>

        {errorMessage && (
          <div className="mb-5">
            <FormAlert>{errorMessage}</FormAlert>
          </div>
        )}

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-ink-2 border border-positive/30 bg-positive-subtle text-positive rounded-[var(--radius)] px-4 py-3">
              Se o e-mail existir, você receberá um link de recuperação.
            </p>

            <Link
              href="/login"
              className="inline-block text-sm font-medium text-ink hover:underline"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <div>
              <Label htmlFor="forgot-email">Email</Label>

              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                placeholder="email@exemplo.com"
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                error={emailError ? "Email inválido" : undefined}
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              Enviar link
            </Button>

            <p className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-ink-2 hover:text-ink transition-colors"
              >
                Voltar para o login
              </Link>
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
