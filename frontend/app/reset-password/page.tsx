"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { resetPassword } from "@/services/auth";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Label from "@/app/components/ui/Label";
import FormAlert from "@/app/components/ui/FormAlert";
import PageTransition from "@/app/components/transitions/PageTransition";

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

  const confirmError = touched && !confirmValid && confirm.length > 0;

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
      <div className="min-h-dvh flex items-center justify-center bg-paper text-ink px-4 py-10">
        <main id="main" className="w-full max-w-sm text-center space-y-4" tabIndex={-1}>
          <h1 className="text-2xl font-light tracking-tight">
            Link inválido
          </h1>

          <p className="text-sm text-ink-2">
            Este link de recuperação está incompleto. Solicite um novo link.
          </p>

          <Link
            href="/forgot-password"
            className="inline-block text-sm font-medium text-ink hover:underline"
          >
            Solicitar novo link
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-paper text-ink px-4 py-10">
      <main id="main" className="w-full max-w-sm" tabIndex={-1}>
        <p className="text-center text-[13px] text-ink-3 mb-2">
          Fluxa
        </p>

        <h1 className="text-center text-3xl font-light tracking-tight mb-2">
          Redefinir senha
        </h1>

        <p className="text-sm text-ink-2 text-center mb-8">
          Escolha uma nova senha (mínimo 8 caracteres).
        </p>

        {errorMessage && (
          <div className="mb-5">
            <FormAlert>{errorMessage}</FormAlert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div>
            <Label htmlFor="reset-password">Nova senha</Label>

            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              value={password}
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched(true)}
              error={touched && !passwordValid ? "A senha deve ter pelo menos 8 caracteres" : undefined}
            />
          </div>

          <div>
            <Label htmlFor="reset-confirm">Confirmar nova senha</Label>

            <Input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              placeholder="••••••••"
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => setTouched(true)}
              error={confirmError ? "As senhas devem coincidir" : undefined}
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            Redefinir senha
          </Button>
        </form>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <PageTransition>
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
    </PageTransition>
  );
}
