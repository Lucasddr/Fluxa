import { formatCurrency, formatPaymentMethod } from "@/app/utils/Formatters";

// pt-BR usa NBSP (U+00A0) entre "R$" e o número - normalizar para comparar.
function normalize(s: string): string {
    return s.replace(/\u00A0/g, " ");
}

describe("formatCurrency", () => {
    it("formata valores com padrão pt-BR/BRL", () => {
        expect(normalize(formatCurrency(1500))).toBe("R$ 1.500,00");
        expect(normalize(formatCurrency(0.05))).toBe("R$ 0,05");
        expect(normalize(formatCurrency(1234.5))).toBe("R$ 1.234,50");
    });

    it("formata negativos e milhar", () => {
        expect(normalize(formatCurrency(-70))).toBe("-R$ 70,00");
        expect(normalize(formatCurrency(1234567.89))).toBe("R$ 1.234.567,89");
    });
});

describe("formatPaymentMethod", () => {
    it("mapeia todos os métodos conhecidos", () => {
        expect(formatPaymentMethod("PIX")).toBe("Pix");
        expect(formatPaymentMethod("CREDIT")).toBe("Cartão de Crédito");
        expect(formatPaymentMethod("DEBIT")).toBe("Cartão de Débito");
        expect(formatPaymentMethod("CASH")).toBe("Dinheiro");
    });

    it("cai em Outro para desconhecidos", () => {
        expect(formatPaymentMethod("OTHER")).toBe("Outro");
        expect(formatPaymentMethod("")).toBe("Outro");
    });
});
