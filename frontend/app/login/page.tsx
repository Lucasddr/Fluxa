"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, me } from "@/services/auth";
import ThemeToggle from "@/app/components/ui/ThemeToggle";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Label from "@/app/components/ui/Label";
import FormAlert from "@/app/components/ui/FormAlert";

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
          setErrorMessage("Credenciais inválidas");
        } else {
          setErrorMessage("Erro ao conectar com o servidor. Tente novamente mais tarde");
        }
        return;
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

  return (
    <div className="min-h-dvh flex flex-col bg-paper text-ink">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>

      <main id="main" className="flex-1 flex items-center justify-center px-4 pb-16" tabIndex={-1}>
        <div className="w-full max-w-sm">
          <p className="text-center text-[13px] text-ink-3 mb-2">
            Fluxa
          </p>

          <h1 className="text-center text-3xl font-light tracking-tight mb-8">
            Entrar
          </h1>

          {errorMessage && (
            <div className="mb-5">
              <FormAlert>{errorMessage}</FormAlert>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5" noValidate>
            <div>
              <Label htmlFor="login-email">Email</Label>

              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                placeholder="email@exemplo.com"
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched("email")}
                aria-invalid={emailError}
                error={emailError ? "Email inválido" : undefined}
              />
            </div>

            <div>
              <Label htmlFor="login-password">Senha</Label>

              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => markTouched("password")}
                aria-invalid={passwordError}
                error={passwordError ? "A senha deve ter pelo menos 8 caracteres" : undefined}
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={!formValid || loading}
            >
              Entrar
            </Button>

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
      </main>
    </div>
  );
}
