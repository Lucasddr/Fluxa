import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CurrencyInput, {
    formatBrlInput,
    formatAmountValue,
} from "@/app/components/ui/CurrencyInput";
import EmptyState from "@/app/components/ui/EmptyState";
import ErrorState from "@/app/components/ui/ErrorState";

describe("formatBrlInput", () => {
    it("vírgula separa decimal; milhar ganha pontos", () => {
        expect(formatBrlInput("1999,99")).toBe("1.999,99");
        expect(formatBrlInput("1999099")).toBe("1.999.099");
    });

    it("ponto é ruído: vira concatenação de dígitos (contrato atual)", () => {
        expect(formatBrlInput("1999.99")).toBe("199.999");
    });

    it("máximo 2 casas decimais, ignorando o resto", () => {
        expect(formatBrlInput("10,999")).toBe("10,99");
    });

    it("remove letras e símbolos não numéricos", () => {
        expect(formatBrlInput("abc1x23")).toBe("123");
    });

    it("vazio e sinal negativo", () => {
        expect(formatBrlInput("")).toBe("");
        expect(formatBrlInput("-")).toBe("-");
    });

    it("preserva o negativo nas duas formas de vírgula", () => {
        expect(formatBrlInput("-70")).toBe("-70");
        expect(formatBrlInput("-70,50")).toBe("-70,50");
    });

    it("zero dianteiro não duplica", () => {
        expect(formatBrlInput("007")).toBe("7");
        expect(formatBrlInput("0,5")).toBe("0,5");
    });
});

describe("formatAmountValue", () => {
    it("formata número para edição com 2 casas", () => {
        expect(formatAmountValue(1234.5)).toBe("1.234,50");
        expect(formatAmountValue(0)).toBe("0,00");
    });

    it("negativo e não finito", () => {
        expect(formatAmountValue(-70)).toBe("-70,00");
        expect(formatAmountValue(NaN)).toBe("");
        expect(formatAmountValue(Infinity)).toBe("");
    });
});

describe("CurrencyInput (componente)", () => {
    it("normaliza o que o usuário digita via onValueChange", async () => {
        const user = userEvent.setup();

        function ControlledHarness() {
            const [value, setValue] = useState("");
            return <CurrencyInput value={value} onValueChange={setValue} />;
        }

        render(<ControlledHarness />);

        const input = screen.getByRole("textbox");
        await user.type(input, "1500,90");

        expect(input).toHaveValue("1.500,90");
        expect(input).toHaveAttribute("inputMode", "decimal");
    });
});

describe("EmptyState (componente)", () => {
    it("usa títulos padrão quando não informados", () => {
        render(<EmptyState />);
        expect(screen.getByText("Nada por aqui ainda")).toBeInTheDocument();
        expect(
            screen.getByText("Quando houver dados, eles aparecerão aqui.")
        ).toBeInTheDocument();
    });

    it("renderiza título/descrição/action", () => {
        render(
            <EmptyState
                title="Sem transações"
                description="Adicione a primeira"
                action={<button type="button">Nova transação</button>}
            />
        );
        expect(screen.getByText("Sem transações")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Nova transação" })
        ).toBeInTheDocument();
    });
});

describe("ErrorState (componente)", () => {
    it("anuncia o erro com role=alert e botão retry", async () => {
        const user = userEvent.setup();
        const onRetry = vi.fn();
        render(<ErrorState message="Falha ao carregar" onRetry={onRetry} />);

        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent("Falha ao carregar");

        await user.click(screen.getByRole("button", { name: /tentar novamente/i }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});
