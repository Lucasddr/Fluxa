"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
      const res = await fetch("http://26.220.230.81:8080/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });

      // 🔥 leitura segura da resposta
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
          Criar conta
        </h1>

        {/* ✅ SUCESSO */}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-600 text-sm border border-green-200">
            Conta criada com sucesso! Redirecionando...
          </div>
        )}

        {/* ❌ ERRO */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">

          {/* NOME */}
          <div>
            <label className="text-sm font-medium text-teal-900">
              Nome
            </label>

            <input
              type="text"
              value={name}
              placeholder="Seu nome"
              onChange={(e) => setName(e.target.value)}
              onBlur={() => markTouched("name")}
              className={`w-full mt-1 p-3 rounded-lg border bg-white text-slate-700
                focus:outline-none focus:ring-2 transition
                ${
                  nameError
                    ? "border-red-500 focus:ring-red-300"
                    : "border-teal-200 focus:ring-teal-400"
                }
              `}
            />

            {nameError && (
              <p className="text-xs text-red-500 mt-1">
                nome muito curto
              </p>
            )}
          </div>

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
            disabled={!formValid || loading || success}
            className="w-full p-3 rounded-lg font-semibold text-white
                      bg-teal-700 hover:bg-teal-800 transition
                      disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>

        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-teal-700 font-medium hover:underline">
            Entrar
          </Link>
        </p>

      </div>
    </div>
  );
}