import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-white via-slate-50 to-teal-50">

      {/* CONTEÚDO CENTRAL */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-2xl text-center">

          {/* LOGO / NOME */}
          <h1 className="text-5xl font-bold text-teal-900 mb-4">
            Fluxa
          </h1>

          {/* SLOGAN */}
          <p className="text-lg text-slate-600 mb-8">
            Um sistema inteligente para organizar, conectar e acelerar seus fluxos de trabalho.
            Simples. Rápido. E feito pra escalar com você 🚀
          </p>

          {/* BOTÃO LOGIN */}
          <Link href="/login">
            <button className="px-6 py-3 rounded-xl bg-teal-700 text-white font-semibold hover:bg-teal-800 transition shadow-md">
              Entrar no sistema
            </button>
          </Link>

          {/* CTA CADASTRO */}
          <p className="mt-6 text-sm text-slate-500">
            Não tem uma conta?{" "}
            <Link
              href="/register"
              className="text-teal-700 font-medium hover:underline"
            >
              Cadastre-se
            </Link>
          </p>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Fluxa — todos os direitos reservados
      </footer>

    </div>
  );
}