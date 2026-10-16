"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, me } from "@/services/auth";
import ThemeToggle from "@/app/components/ui/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    me().then((res) => {
      if (active && res.ok) {
        router.replace("/home");
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  // validações
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;

  const emailError = touched.email && !emailValid;
  const passwordError = touched.password && !passwordValid;

  const formValid = emailValid && passwordValid;

  function markTouched(field: "email" | "password") {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    setTouched({
      email: true,
      password: true,
    });

    if (!formValid) return;

    setLoading(true);

    try {
      const res = await login({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setErrorMessage("Credenciais inválidas")
        } else {
          setErrorMessage("Erro ao conectar com o servidor. Tente novamente mais tarde")
        }
        return
      }

      router.push("/home");

    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Erro ao conectar com o servidor"
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (invalid: boolean) =>
    `w-full mt-1.5 px-3.5 min-h-[48px] rounded-[var(--radius)] border bg-surface text-ink text-[15px] transition-colors duration-[var(--dur-fast)] focus:outline-none focus:border-ink-3 placeholder:text-ink-3 ${
      invalid ? "border-negative" : "border-line"
    }`;

  return (
    <div className="min-h-dvh flex flex-col bg-paper text-ink">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <p className="text-center text-[13px] text-ink-3 mb-2">
            Fluxa
          </p>

          <h1 className="text-center text-3xl font-light tracking-tight mb-8">
            Entrar
          </h1>

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 px-4 py-3 rounded-[var(--radius)] border border-negative/40 text-negative text-sm"
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5" noValidate>
            <div>
              <label htmlFor="login-email" className="text-sm text-ink-2">
                Email
              </label>

              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                placeholder="email@exemplo.com"
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched("email")}
                aria-invalid={emailError}
                className={inputClass(emailError)}
              />

              {emailError && (
                <p className="text-xs text-negative mt-1.5">
                  Email inválido
                </p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="text-sm text-ink-2">
                Senha
              </label>

              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => markTouched("password")}
                aria-invalid={passwordError}
                className={inputClass(passwordError)}
              />

              {passwordError && (
                <p className="text-xs text-negative mt-1.5">
                  A senha deve ter pelo menos 8 caracteres
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!formValid || loading}
              className="w-full min-h-[48px] rounded-[var(--radius)] font-medium text-[15px] text-accent-ink bg-accent transition-opacity duration-[var(--dur-fast)] disabled:opacity-40"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <p className="text-center text-sm">
              <Link
                href="/forgot-password"
                className="text-ink-2 hover:text-ink transition-colors"
              >
                Esqueci minha senha
              </Link>
            </p>
          </form>

          <p className="mt-8 text-center text-sm text-ink-2">
            Novo por aqui?{" "}
            <Link href="/register" className="text-ink font-medium hover:underline">
              Criar conta
            </Link>
          </p>

          <p className="mt-6 text-center text-xs text-ink-3">
            <Link href="/privacy" className="hover:underline">
              Privacidade
            </Link>
            {" · "}
            <Link href="/terms" className="hover:underline">
              Termos
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
