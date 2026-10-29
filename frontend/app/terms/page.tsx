import Link from "next/link";
import PageTransition from "../components/transitions/PageTransition";

export default function TermsPage() {
  return (
    <PageTransition>
    <div className="min-h-dvh flex items-center justify-center bg-paper text-ink px-4 py-10">
      <main id="main" className="w-full max-w-2xl" tabIndex={-1}>
        <div className="text-center mb-8">
          <p className="text-[13px] text-ink-3 mb-2">Fluxa</p>

          <h1 className="text-3xl font-light tracking-tight mb-2">
            Termos de Uso
          </h1>

          <p className="text-xs text-ink-3">
            Minuta protótipo — pendente revisão jurídica
          </p>
        </div>

        <div className="space-y-6 text-sm text-ink-2 leading-relaxed">
          <section>
            <h2 className="font-medium text-ink mb-1">1. O serviço</h2>
            <p>
              O Fluxa é uma aplicação de gestão financeira pessoal (MVP): registro
              de receitas, despesas, categorias e compras parceladas, com dashboard
              e insights. Funcionalidades podem mudar durante o piloto.
            </p>
          </section>

          <section>
            <h2 className="font-medium text-ink mb-1">2. Sua conta</h2>
            <p>
              Cadastro com nome, e-mail válido e senha de 8+ caracteres. Guarde sua
              senha e não compartilhe credenciais. Sessões expiram e o logout
              encerra o acesso neste navegador.
            </p>
          </section>

          <section>
            <h2 className="font-medium text-ink mb-1">3. Seus lançamentos</h2>
            <p>
              Os dados são seus. Excluir uma compra com parcelas pagas exibe um
              aviso: com confirmação, apaga-se tudo junto (compra, parcelas e
              transações geradas), sem deixar órfãs. Texto completo em{" "}
              <span className="font-medium text-ink">docs/LGPD-TERMOS.md</span>.
            </p>
          </section>

          <section>
            <h2 className="font-medium text-ink mb-1">4. Privacidade</h2>
            <p>
              O tratamento de dados segue a{" "}
              <Link href="/privacy" className="text-ink font-medium hover:underline">
                Política de Privacidade
              </Link>
              , parte destes Termos.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-line flex items-center justify-center gap-4 text-sm">
          <Link href="/privacy" className="text-ink-2 hover:text-ink transition-colors">
            Política de Privacidade
          </Link>
          <span className="text-ink-3">|</span>
          <Link href="/register" className="text-ink-2 hover:text-ink transition-colors">
            Criar conta
          </Link>
        </div>
      </main>
    </div>
    </PageTransition>
  );
}
