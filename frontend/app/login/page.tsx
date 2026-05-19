"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

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
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Email ou senha inválidos");
      }

      if (!data?.token) {
        throw new Error("Token não retornado pelo backend");
      }

      localStorage.setItem("token", data.token);


      router.push("/home");

    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-white via-slate-50 to-teal-50">
      <div className="w-full max-w-md bg-white border border-teal-100 rounded-2xl p-8 shadow-lg">

        <h1 className="text-3xl font-bold text-teal-900 text-center mb-6">
          Login
        </h1>

        {/* erro geral */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">

          {/* EMAIL */}
          <div>
            <label className="text-sm font-medium text-teal-900">
              Email
            </label>

            <input
              type="email"
              value={email}
              placeholder="email@exemplo.com"
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => markTouched("email")}
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

          {/* SENHA */}
          <div>
            <label className="text-sm font-medium text-teal-900">
              Senha
            </label>

            <input
              type="password"
              value={password}
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => markTouched("password")}
              className={`w-full mt-1 p-3 rounded-lg border bg-white text-slate-700
                focus:outline-none focus:ring-2 transition
                ${
                  passwordError
                    ? "border-red-500 focus:ring-red-300"
                    : "border-teal-200 focus:ring-teal-400"
                }
              `}
            />

            {passwordError && (
              <p className="text-xs text-red-500 mt-1">
                a senha deve ter pelo menos 8 caracteres
              </p>
            )}
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={!formValid || loading}
            className="w-full p-3 rounded-lg font-semibold text-white
                      bg-teal-700 hover:bg-teal-800 transition
                        disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

        </form>
      </div>
    </div>
  );
}