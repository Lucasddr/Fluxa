import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-paper text-ink px-4 py-10">
      <main id="main" className="w-full max-w-2xl" tabIndex={-1}>
        <div className="text-center mb-8">
          <p className="text-[13px] text-ink-3 mb-2">Fluxa</p>

          <h1 className="text-3xl font-light tracking-tight mb-2">
            Política de Privacidade
          </h1>

          <p className="text-xs text-ink-3">
            Minuta protótipo — pendente revisão jurídica
          </p>
        </div>

        <div className="space-y-6 text-sm text-ink-2 leading-relaxed">
          <section>
            <h2 className="font-medium text-ink mb-1">1. Quais dados coletamos</h2>
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
            <h2 className="font-medium text-ink mb-1">2. Para que usamos</h2>
            <p>
              Operar sua conta (login, recuperação de senha, verificação de e-mail),
              exibir dashboard e insights, e manter a segurança (rate limiting, logs
              operacionais sem segredos). Não vendemos nem compartilhamos seus dados
              com anunciantes.
            </p>
          </section>

          <section>
            <h2 className="font-medium text-ink mb-1">3. Seus direitos (LGPD)</h2>
            <p>
              Confirmação, acesso, correção, anonimização, bloqueio, eliminação,
              portabilidade e revogação do consentimento. Você pode excluir a conta
              a qualquer momento — a exclusão remove seus lançamentos após
              confirmação em tela. Texto completo em{" "}
              <span className="font-medium text-ink">docs/LGPD-PRIVACIDADE.md</span>.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-line flex items-center justify-center gap-4 text-sm">
          <Link href="/terms" className="text-ink-2 hover:text-ink transition-colors">
            Termos de Uso
          </Link>
          <span className="text-ink-3">|</span>
          <Link href="/login" className="text-ink-2 hover:text-ink transition-colors">
            Voltar ao login
          </Link>
        </div>
      </main>
    </div>
  );
}
