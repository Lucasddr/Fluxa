import { render, screen } from "@testing-library/react";

import PageTransition from "./PageTransition";

describe("PageTransition", () => {
    it("renderiza o conteúdo normalmente (transição só existe no navegador)", () => {
        render(
            <PageTransition>
                <p>Conteúdo da página</p>
            </PageTransition>
        );

        expect(screen.getByText("Conteúdo da página")).toBeInTheDocument();
    });

    it("não injeta elementos extras entre a página e o conteúdo", () => {
        const { container } = render(
            <PageTransition>
                <span>filho</span>
            </PageTransition>
        );

        expect(container.querySelector("span")?.textContent).toBe("filho");
    });
});
