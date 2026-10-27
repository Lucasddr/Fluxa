import { test, expect } from "@playwright/test";
import { prepareUserSession, stateFor } from "./sessions";

const SESSION = stateFor("credit");

test.describe("compra no crédito parcelada (UI real)", () => {
    test.beforeAll(async ({ browser }) => {
        if (!SESSION.exists()) {
            await prepareUserSession(browser, {
                name: "QA Crédito",
                fileKey: "credit",
            });
        }
    });

    test.use({ storageState: SESSION.storageState });

    test.beforeEach(async ({ page }) => {
        await page.goto("/home/accounts");
        await expect(
            page
                .getByRole("button", { name: "Nova compra parcelada" })
                .first()
        ).toBeVisible();
    });

    test("cria compra de 2 parcelas iguais e vê a compra na lista", async ({
        page,
    }) => {
        await page
            .getByRole("button", { name: "Nova compra parcelada" })
            .first()
            .click();

        await page.getByLabel("Título").fill("Geladeira QA");
        await page.getByLabel("Valor total (R$)").fill("90");
        await page.getByLabel(/Parcelas \(/).fill("2");
        await page
            .getByLabel("Categoria (despesa)")
            .selectOption({ label: "Mercado" });
        await page
            .getByLabel("Primeiro vencimento")
            .fill(addMonths(new Date().toISOString().slice(0, 10), 1));

        await page
            .getByRole("button", { name: "Salvar compra" })
            .click();

        await expect(
            page.getByText("Geladeira QA").first()
        ).toBeVisible({ timeout: 20_000 });
    });

    test("soma divergente das parcelas bloqueia o salvamento", async ({
        page,
    }) => {
        await page
            .getByRole("button", { name: "Nova compra parcelada" })
            .first()
            .click();

        await page.getByLabel("Título").fill("Compra divergente QA");
        await page.getByLabel("Valor total (R$)").fill("100");
        await page.getByLabel(/Parcelas \(/).fill("2");
        await page
            .getByLabel("Categoria (despesa)")
            .selectOption({ label: "Mercado" });

        await page
            .getByRole("button", { name: /Diferentes \(manual\)/ })
            .click();
        await page
            .getByLabel("Valor da parcela 1")
            .fill("60");
        await page
            .getByLabel("Valor da parcela 2")
            .fill("20");

        await page
            .getByRole("button", { name: "Salvar compra" })
            .click();

        await expect(
            page.getByText(/deve ser igual ao total/i)
        ).toBeVisible();
        await expect(
            page.getByText("Compra divergente QA")
        ).toHaveCount(0);
    });
});

function addMonths(isoDate: string, months: number): string {
    const d = new Date(`${isoDate}T12:00:00`);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
}
