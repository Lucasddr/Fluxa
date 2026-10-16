"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { forgotPassword } from "@/services/auth";
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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-white via-slate-50 to-teal-50">
      <div className="w-full max-w-md bg-white border border-teal-100 rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-teal-900 text-center mb-2">
          Esqueci minha senha
        </h1>

        <p className="text-sm text-slate-500 text-center mb-6">
          Digite seu e-mail para receber o link de recuperação.
        </p>

        {errorMessage && (
          <div className="mb-4">
            <FormAlert>{errorMessage}</FormAlert>
          </div>
        )}

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-slate-600 bg-teal-50 border border-teal-200 rounded-lg px-3 py-3">
              Se o e-mail existir, você receberá um link de recuperação.
            </p>

            <Link
              href="/login"
              className="inline-block text-sm font-medium text-teal-700 hover:underline"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-teal-900">
                Email
              </label>

              <input
                type="email"
                value={email}
                placeholder="email@exemplo.com"
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                className={`w-full mt-1 p-3 rounded-lg border bg-white text-slate-700
                  focus:outline-none focus:ring-2 transition
                  ${
                    emailError
                      ? "border-red-500 focus:ring-red-300"
                      : "border-teal-200 focus:ring-teal-400"
                  }
                `}
              />

              {emailError && (
                <p className="text-xs text-red-500 mt-1">
                  email inválido
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!emailValid || loading}
              className="w-full p-3 rounded-lg font-semibold text-white
                        bg-teal-700 hover:bg-teal-800 transition
                          disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar link"}
            </button>

            <p className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-teal-700 hover:underline"
              >
                Voltar para o login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
