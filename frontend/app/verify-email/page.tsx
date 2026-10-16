"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { sendVerification, verifyEmail } from "@/services/auth";
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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-white via-slate-50 to-teal-50">
      <div className="w-full max-w-md bg-white border border-teal-100 rounded-2xl p-8 shadow-lg text-center space-y-4">
        <h1 className="text-2xl font-bold text-teal-900">
          Verificação de e-mail
        </h1>

        {status === "loading" && (
          <p className="text-sm text-slate-500">
            Verificando seu e-mail...
          </p>
        )}

        {status === "ok" && (
          <>
            <p className="text-sm text-slate-600 bg-teal-50 border border-teal-200 rounded-lg px-3 py-3">
              E-mail verificado com sucesso.
            </p>

            <Link
              href="/login"
              className="inline-block text-sm font-medium text-teal-700 hover:underline"
            >
              Ir para o login
            </Link>
          </>
        )}

        {status === "error" && errorMessage && (
          <FormAlert>{errorMessage}</FormAlert>
        )}

        {(status === "error" || status === "none") && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full p-3 rounded-lg font-semibold text-white
                        bg-teal-700 hover:bg-teal-800 transition
                          disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? "Enviando..." : "Reenviar e-mail"}
            </button>

            {resent && (
              <p className="text-sm text-slate-600 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                E-mail reenviado. Verifique sua caixa de entrada.
              </p>
            )}

            <p>
              <Link
                href="/login"
                className="text-sm font-medium text-teal-700 hover:underline"
              >
                Voltar para o login
              </Link>
            </p>
          </div>
        )}
      </div>
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
