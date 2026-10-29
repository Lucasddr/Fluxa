import { ViewTransition } from "react";
import type { ReactNode } from "react";

/**
 * Envolve o conteúdo de uma página para animar a troca de rota
 * (fade out rápido do conteúdo antigo, fade in deslizando do novo).
 *
 * Regra do Next.js 16 / React ViewTransition: o wrapper vai no `page.tsx`,
 * nunca no layout — layouts persistem entre navegações, e enter/exit
 * não disparam neles.
 *
 * Links de navegação podem marcar direção com `transitionTypes`
 * (ver NavLink/BottomNav): "nav-forward" desliza para a esquerda,
 * "nav-back" para a direita. Sem direção (login, back do navegador,
 * router.replace), cai no default suave `page-enter`/`page-exit`.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{
        "nav-forward": "page-enter-forward",
        "nav-back": "page-enter-back",
        default: "page-enter",
      }}
      exit={{
        "nav-forward": "page-exit-forward",
        "nav-back": "page-exit-back",
        default: "page-exit",
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
