"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { resetPassword } from "@/services/auth";
import FormAlert from "@/app/components/ui/FormAlert";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordValid = password.length >= 8;
  const confirmValid = confirm === password && confirm.length > 0;
  const formValid = passwordValid && confirmValid && token.length > 0;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setTouched(true);

    if (!formValid) return;

    setLoading(true);

    try {
      const res = await resetPassword(token, password);

      if (!res.ok) {
        if (res.status === 400 || res.status === 401 || res.status === 404) {
          setErrorMessage(
            "Token inválido ou expirado. Solicite um novo link."
          );
        } else {
          setErrorMessage(
            "Erro ao redefinir a senha. Tente novamente mais tarde."
          );
        }
        return;
      }

      router.push("/login?reset=ok");
    } catch {
      setErrorMessage("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-white via-slate-50 to-teal-50">
        <div className="w-full max-w-md bg-white border border-teal-100 rounded-2xl p-8 shadow-lg text-center space-y-4">
          <h1 className="text-2xl font-bold text-teal-900">
            Link inválido
          </h1>

          <p className="text-sm text-slate-500">
            Este link de recuperação está incompleto. Solicite um novo link.
          </p>

          <Link
            href="/forgot-password"
            className="inline-block text-sm font-medium text-teal-700 hover:underline"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-white via-slate-50 to-teal-50">
      <div className="w-full max-w-md bg-white border border-teal-100 rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-teal-900 text-center mb-2">
          Redefinir senha
        </h1>

        <p className="text-sm text-slate-500 text-center mb-6">
          Escolha uma nova senha (mínimo 8 caracteres).
        </p>

        {errorMessage && (
          <div className="mb-4">
            <FormAlert>{errorMessage}</FormAlert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-teal-900">
              Nova senha
            </label>

            <input
              type="password"
              value={password}
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched(true)}
              className="w-full mt-1 p-3 rounded-lg border bg-white text-slate-700 border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-teal-900">
              Confirmar nova senha
            </label>

            <input
              type="password"
              value={confirm}
              placeholder="••••••••"
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => setTouched(true)}
              className="w-full mt-1 p-3 rounded-lg border bg-white text-slate-700 border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
            />

            {touched && !confirmValid && (
              <p className="text-xs text-red-500 mt-1">
                as senhas devem coincidir
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!formValid || loading}
            className="w-full p-3 rounded-lg font-semibold text-white
                      bg-teal-700 hover:bg-teal-800 transition
                        disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
