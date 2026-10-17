"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { sendVerification, verifyEmail } from "@/services/auth";
import Button from "@/app/components/ui/Button";
import FormAlert from "@/app/components/ui/FormAlert";

type Status = "loading" | "ok" | "error" | "none";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<Status>(token ? "loading" : "none");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const verifiedRef = useRef(false);

  const runVerification = useCallback(
    async (t: string) => {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const res = await verifyEmail(t);

        if (!res.ok) {
          setStatus("error");
          setErrorMessage(
            "Link inválido ou expirado. Solicite um novo e-mail de verificação."
          );
          return;
        }

        setStatus("ok");
      } catch {
        setStatus("error");
        setErrorMessage("Erro ao conectar com o servidor.");
      }
    },
    []
  );

  useEffect(() => {
    if (token && !verifiedRef.current) {
      verifiedRef.current = true;
      void runVerification(token);
    }
  }, [token, runVerification]);

  async function handleResend() {
    setErrorMessage(null);
    setResent(false);
    setResending(true);

    try {
      const res = await sendVerification();

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setErrorMessage("Erro ao reenviar. Tente novamente mais tarde.");
        return;
      }

      setResent(true);
    } catch {
      setErrorMessage("Erro ao conectar com o servidor.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-paper text-ink px-4 py-10">
      <main id="main" className="w-full max-w-sm text-center space-y-4" tabIndex={-1}>
        <p className="text-[13px] text-ink-3 mb-2">
          Fluxa
        </p>

        <h1 className="text-2xl font-light tracking-tight">
          Verificação de e-mail
        </h1>

        {status === "loading" && (
          <p className="text-sm text-ink-2">
            Verificando seu e-mail...
          </p>
        )}

        {status === "ok" && (
          <>
            <p className="text-sm text-positive border border-positive/30 bg-positive-subtle rounded-[var(--radius)] px-4 py-3">
              E-mail verificado com sucesso.
            </p>

            <Button asChild variant="secondary" className="w-full">
              <Link href="/login">Ir para o login</Link>
            </Button>
          </>
        )}

        {status === "error" && errorMessage && (
          <FormAlert>{errorMessage}</FormAlert>
        )}

        {(status === "error" || status === "none") && (
          <div className="space-y-3">
            <Button
              onClick={handleResend}
              loading={resending}
              disabled={resending}
              className="w-full"
            >
              Reenviar e-mail
            </Button>

            {resent && (
              <p className="text-sm text-positive border border-positive/30 bg-positive-subtle rounded-[var(--radius)] px-4 py-2">
                E-mail reenviado. Verifique sua caixa de entrada.
              </p>
            )}

            <p>
              <Link
                href="/login"
                className="text-sm font-medium text-ink-2 hover:text-ink transition-colors"
              >
                Voltar para o login
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
