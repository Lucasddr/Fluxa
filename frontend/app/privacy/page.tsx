import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-white via-slate-50 to-teal-50 px-4 py-10">
      <div className="w-full max-w-2xl bg-white border border-teal-100 rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-teal-900 text-center mb-2">
          Política de Privacidade
        </h1>
        <p className="text-center text-xs text-slate-400 mb-6">
          Minuta protótipo — pendente revisão jurídica
        </p>

        <div className="space-y-5 text-sm text-slate-600">
          <section>
            <h2 className="font-semibold text-teal-900 mb-1">1. Quais dados coletamos</h2>
            <p>
              Nome, e-mail e hash da senha (Argon2, nunca em texto) para sua conta;
              os lançamentos que você registra (transações, categorias, parcelas);
              tokens de sessão/recuperação (como hash, com expiração); e cookies
              estritamente necessários de sessão (HttpOnly, sem acesso via JS).
              Não há cookies de terceiros, analytics ou publicidade. Não pedimos
              senhas de banco nem números de cartão.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-teal-900 mb-1">2. Para que usamos</h2>
            <p>
              Operar sua conta (login, recuperação de senha, verificação de e-mail),
              exibir dashboard e insights, e manter a segurança (rate limiting, logs
              operacionais sem segredos). Não vendemos nem compartilhamos seus dados
              com anunciantes.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-teal-900 mb-1">3. Seus direitos (LGPD)</h2>
            <p>
              Confirmação, acesso, correção, anonimização, bloqueio, eliminação,
              portabilidade e revogação do consentimento. Você pode excluir a conta
              a qualquer momento — a exclusão remove seus lançamentos após
              confirmação em tela. Texto completo em{" "}
              <span className="font-medium">docs/LGPD-PRIVACIDADE.md</span>.
            </p>
          </section>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-sm">
          <Link href="/terms" className="text-teal-700 font-medium hover:underline">
            Termos de Uso
          </Link>
          <span className="text-slate-300">|</span>
          <Link href="/login" className="text-teal-700 font-medium hover:underline">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
