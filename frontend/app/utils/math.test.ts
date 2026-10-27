import { getPercentage } from "@/app/utils/math";

describe("getPercentage", () => {
    it("calcula porcentagem normal arredondada", () => {
        expect(getPercentage(50, 200)).toBe("25");
        expect(getPercentage(1, 3)).toBe("33");
    });

    it("guarda anti-zero: total 0 nunca gera NaN", () => {
        expect(getPercentage(10, 0)).toBe("0");
        expect(getPercentage(0, 0)).toBe("0");
    });

    it("100% e acima", () => {
        expect(getPercentage(200, 200)).toBe("100");
        expect(getPercentage(300, 200)).toBe("150");
    });
});
