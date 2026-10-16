import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-white via-slate-50 to-teal-50 px-4 py-10">
      <div className="w-full max-w-2xl bg-white border border-teal-100 rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-teal-900 text-center mb-2">
          Termos de Uso
        </h1>
        <p className="text-center text-xs text-slate-400 mb-6">
          Minuta protótipo — pendente revisão jurídica
        </p>

        <div className="space-y-5 text-sm text-slate-600">
          <section>
            <h2 className="font-semibold text-teal-900 mb-1">1. O serviço</h2>
            <p>
              O Fluxa é uma aplicação de gestão financeira pessoal (MVP): registro
              de receitas, despesas, categorias e compras parceladas, com dashboard
              e insights. Funcionalidades podem mudar durante o piloto.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-teal-900 mb-1">2. Sua conta</h2>
            <p>
              Cadastro com nome, e-mail válido e senha de 8+ caracteres. Guarde sua
              senha e não compartilhe credenciais. Sessões expiram e o logout
              encerra o acesso neste navegador.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-teal-900 mb-1">3. Seus lançamentos</h2>
            <p>
              Os dados são seus. Excluir uma compra com parcelas pagas exibe um
              aviso: com confirmação, apaga-se tudo junto (compra, parcelas e
              transações geradas), sem deixar órfãs. Texto completo em{" "}
              <span className="font-medium">docs/LGPD-TERMOS.md</span>.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-teal-900 mb-1">4. Privacidade</h2>
            <p>
              O tratamento de dados segue a{" "}
              <Link href="/privacy" className="text-teal-700 font-medium hover:underline">
                Política de Privacidade
              </Link>
              , parte destes Termos.
            </p>
          </section>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-sm">
          <Link href="/privacy" className="text-teal-700 font-medium hover:underline">
            Política de Privacidade
          </Link>
          <span className="text-slate-300">|</span>
          <Link href="/register" className="text-teal-700 font-medium hover:underline">
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
