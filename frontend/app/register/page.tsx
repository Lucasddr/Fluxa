"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/services/auth";
import ThemeToggle from "@/app/components/ui/ThemeToggle";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // validações
  const nameValid = name.trim().length >= 2;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;

  const nameError = touched.name && !nameValid;
  const emailError = touched.email && !emailValid;
  const passwordError = touched.password && !passwordValid;

  const formValid = nameValid && emailValid && passwordValid;

  function markTouched(field: "name" | "email" | "password") {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setErrorMessage(null);

    setTouched({
      name: true,
      email: true,
      password: true,
    });

    if (!formValid) return;

    setLoading(true);

    try {
      const res = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      // leitura segura da resposta
      const text = await res.text();

      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }

      if (!res.ok) {
        throw new Error(data?.message || "Erro ao cadastrar");
      }

      // sucesso
      setSuccess(true);

      // redireciona após 1.5s
      setTimeout(() => {
        router.push("/login");
      }, 1500);

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
            Criar conta
          </h1>

          {success && (
            <div
              role="status"
              className="mb-5 px-4 py-3 rounded-[var(--radius)] border border-positive/40 text-positive text-sm"
            >
              Conta criada com sucesso! Redirecionando...
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 px-4 py-3 rounded-[var(--radius)] border border-negative/40 text-negative text-sm"
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-5" noValidate>
            <div>
              <label htmlFor="register-name" className="text-sm text-ink-2">
                Nome
              </label>

              <input
                id="register-name"
                type="text"
                autoComplete="name"
                value={name}
                placeholder="Seu nome"
                onChange={(e) => setName(e.target.value)}
                onBlur={() => markTouched("name")}
                aria-invalid={nameError}
                className={inputClass(nameError)}
              />

              {nameError && (
                <p className="text-xs text-negative mt-1.5">
                  Nome muito curto
                </p>
              )}
            </div>

            <div>
              <label htmlFor="register-email" className="text-sm text-ink-2">
                Email
              </label>

              <input
                id="register-email"
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
              <label htmlFor="register-password" className="text-sm text-ink-2">
                Senha
              </label>

              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                value={password}
                placeholder="Mínimo 8 caracteres"
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
              disabled={!formValid || loading || success}
              className="w-full min-h-[48px] rounded-[var(--radius)] font-medium text-[15px] text-accent-ink bg-accent transition-opacity duration-[var(--dur-fast)] disabled:opacity-40"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-2">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-ink font-medium hover:underline">
              Entrar
            </Link>
          </p>

          <p className="mt-6 text-center text-xs text-ink-3">
            Ao criar a conta você concorda com os{" "}
            <Link href="/terms" className="hover:underline">
              Termos
            </Link>
            {" "}e a{" "}
            <Link href="/privacy" className="hover:underline">
              Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
