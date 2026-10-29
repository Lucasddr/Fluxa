import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Button from "./components/ui/Button";
import PageTransition from "./components/transitions/PageTransition";

export default function HomePage() {
  return (
    <PageTransition>
    <div className="min-h-dvh flex flex-col bg-paper text-ink">
      <header className="flex items-center justify-between px-6 py-4 border-b border-line">
        <span className="text-lg font-medium tracking-tight">Opsire</span>

        <nav className="flex shrink-0 items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-ink-2 hover:text-ink transition-colors"
          >
            Entrar
          </Link>

          <Button asChild size="sm">
            <Link href="/register">Criar conta</Link>
          </Button>
        </nav>
      </header>

      <main
        id="main"
        className="flex w-full flex-1 items-center justify-center px-6 py-16 sm:py-20"
        tabIndex={-1}
      >
        <div className="grid w-full min-w-0 max-w-5xl grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:gap-20">
          <section className="min-w-0">
            <p className="mb-5 text-xs font-medium uppercase tracking-[0.16em] text-ink-3">
              Finanças pessoais, com clareza
            </p>

            <h1 className="mb-6 max-w-2xl text-4xl font-light leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Saiba o que entrou, saiu e ainda vai vencer.
            </h1>

            <p className="mb-9 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
              Receitas, despesas e compromissos futuros no mesmo lugar — para
              decidir com números, não com suposições.
            </p>

            <div className="flex flex-col items-start gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  <span className="inline-flex items-center gap-2">
                    Começar agora
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </span>
                </Link>
              </Button>

              <Button asChild variant="secondary" size="lg">
                <Link href="/login">Já tenho conta</Link>
              </Button>
            </div>
          </section>

          <section
            aria-labelledby="overview-title"
            className="min-w-0 border-l border-line pl-6 sm:pl-8"
          >
            <h2
              id="overview-title"
              className="mb-5 text-xs font-medium uppercase tracking-[0.16em] text-ink-3"
            >
              Uma visão para o mês inteiro
            </h2>
            <ul className="divide-y divide-line border-y border-line">
              <li className="py-4 text-sm font-medium text-ink sm:text-base">
                Entradas e despesas
              </li>
              <li className="py-4 text-sm font-medium text-ink sm:text-base">
                Contas a pagar e parcelas
              </li>
              <li className="py-4 text-sm font-medium text-ink sm:text-base">
                Saldo e movimentações recentes
              </li>
            </ul>
          </section>
        </div>
      </main>

      <footer className="px-6 py-6 border-t border-line">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-3">
          <span>© {new Date().getFullYear()} Opsire — todos os direitos reservados</span>

          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-ink transition-colors">
              Termos de uso
            </Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
    </PageTransition>
  );
}
