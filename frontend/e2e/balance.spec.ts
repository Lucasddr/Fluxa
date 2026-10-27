import { test, expect } from "@playwright/test";
import { prepareUserSession, stateFor } from "./sessions";

const SESSION = stateFor("balance");

test.describe("conferência de saldo (UI real)", () => {
    test.beforeAll(async ({ browser }) => {
        if (!SESSION.exists()) {
            await prepareUserSession(browser, {
                name: "QA Saldo",
                fileKey: "balance",
            });
        }
    });

    test.use({ storageState: SESSION.storageState });

    test.beforeEach(async ({ page }) => {
        await page.goto("/home/bank-accounts");
        await expect(
            page
                .getByRole("button", { name: /Informar saldo|Revisar saldo/ })
                .first()
        ).toBeVisible();
    });

    test("informar saldo com divergência cria revisão pendente", async ({
        page,
    }) => {
        await page
            .getByRole("button", { name: /Informar saldo|Revisar saldo/ })
            .first()
            .click();

        await expect(
            page.getByText("Informar saldo observado").first()
        ).toBeVisible();

        await page.getByLabel("Saldo (R$)").fill("1.234,56");
        await page
            .getByLabel("Saldo válido em")
            .fill(new Date().toISOString().slice(0, 10));
        await page
            .getByRole("button", { name: "Salvar saldo observado" })
            .click();

        await expect(
            page.getByText(/Saldos pendentes de revisão/)
        ).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText(/Diferença/).first()).toBeVisible();
    });

    test("resolver com observado mostra a base escolhida no dashboard", async ({
        page,
    }) => {
        await page
            .getByRole("button", { name: /Informar saldo|Revisar saldo/ })
            .first()
            .click();
        await page.getByLabel("Saldo (R$)").fill("900,00");
        await page
            .getByLabel("Saldo válido em")
            .fill(new Date().toISOString().slice(0, 10));
        await page
            .getByRole("button", { name: "Salvar saldo observado" })
            .click();

        await expect(
            page.getByText(/Saldos pendentes de revisão/)
        ).toBeVisible({ timeout: 20_000 });

        // Resolve TODAS as pendências acumuladas (runs anteriores deixam
        // observações pendentes): o dashboard só fica USER_ACCEPTED quando
        // nenhuma revisão fica em aberto.
        let remaining = await page
            .getByRole("button", { name: "Usar saldo informado como base" })
            .count();
        while (remaining > 0) {
            const resolveResponse = page.waitForResponse(
                (r) =>
                    r.url().includes("/resolve") &&
                    r.request().method() !== "GET"
            );
            await page
                .getByRole("button", { name: "Usar saldo informado como base" })
                .first()
                .click();
            await resolveResponse;
            remaining = await page
                .getByRole("button", { name: "Usar saldo informado como base" })
                .count();
        }

        // Dashboard reflete a decisão.
        await page.goto("/home/dashboard");
        await expect(
            page.getByText("Base escolhida por você")
        ).toBeVisible({ timeout: 20_000 });
    });
});
