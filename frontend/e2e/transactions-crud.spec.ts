import { test, expect } from "@playwright/test";
import { prepareUserSession, stateFor } from "./sessions";

const SESSION = stateFor("transactions");

function todayIso(offsetDays = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
}

test.describe("CRUD de transações (UI real)", () => {
    test.beforeAll(async ({ browser }) => {
        if (!SESSION.exists()) {
            await prepareUserSession(browser, {
                name: "QA Tx",
                fileKey: "transactions",
            });
        }
    });

    test.use({ storageState: SESSION.storageState });

    test.beforeEach(async ({ page }) => {
        await page.goto("/home/transactions");
        await expect(page.getByRole("heading", { name: "Transações" })).toBeVisible();
    });

    test("cria despesa com categoria nova em linha e vê na lista", async ({
        page,
    }) => {
        await page.getByRole("button", { name: "Nova transação" })
            .or(page.getByRole("button", { name: "Nova", exact: true }))
            .first().click();
        await expect(
            page.getByRole("heading", { name: "Nova Transação" })
        ).toBeVisible();

        await page.getByRole("button", { name: /Saída/ }).click();
        await page.getByLabel("Valor").fill("50");
        await page.getByLabel("Conta").selectOption({ index: 1 });
        await page
            .getByLabel("Categoria", { exact: true })
            .selectOption({ label: "+ Criar nova categoria de despesa" });

        await expect(
            page.getByRole("textbox", { name: /Nome da categoria/i })
        ).toBeVisible();
        await page
            .getByLabel("Nome da categoria")
            .fill(`QA Market ${Date.now()}`);
        await page.getByRole("button", { name: "Criar categoria" }).click();

        await page
            .getByLabel("Forma de Pagamento", { exact: true })
            .selectOption({ label: "Pix" });
        await page
            .getByLabel("Data")
            .fill(todayIso());
        await page
            .getByLabel("Nome", { exact: true }).fill("Mercado QA");
        await page
            .getByRole("button", { name: "Salvar Transação" })
            .click();

        await expect(
            page.getByText("Mercado QA").first()
        ).toBeVisible({ timeout: 20_000 });
    });

    test("valida cadastro incompleto sem salvar", async ({ page }) => {
        await page.getByRole("button", { name: "Nova transação" })
            .or(page.getByRole("button", { name: "Nova", exact: true }))
            .first().click();
        await page.getByRole("button", { name: "Salvar Transação" }).click();

        await expect(
            page.getByRole("heading", { name: "Nova Transação" })
        ).toBeVisible();
        await expect(
            page.getByText(/Informe o valor|preencha|inváli/i).first()
        ).toBeVisible();
    });

    test("edita descrição pelo menu da linha", async ({ page }) => {
        const title = `Editável QA ${Date.now()}`;
        await createExpense(page, title);

        // Menu da LINHA que contém o título (não do primeiro item da lista).
        const row = page
            .getByText(title, { exact: true })
            .locator(
                "xpath=ancestor::*[.//button[@aria-label='Opções da transação']][1]"
            );
        await row
            .getByRole("button", { name: "Opções da transação" })
            .click();
        await page.getByRole("menuitem", { name: "Editar" }).click();

        const nameField = page.getByLabel(/Nome/, { exact: true });
        await nameField.fill(`${title} v2`);
        await page
            .getByRole("button", { name: "Salvar alterações" })
            .click();

        await expect(page.getByText(`${title} v2`).first()).toBeVisible({
            timeout: 20_000,
        });
    });

    test("exclui transação pelo menu da linha", async ({ page }) => {
        const title = `Volátil QA ${Date.now()}`;
        await createExpense(page, title);

        await expect(page.getByText(title).first()).toBeVisible({
            timeout: 20_000,
        });

        // Menu da LINHA que contém o título (não do primeiro item da lista).
        const row = page
            .getByText(title, { exact: true })
            .locator(
                "xpath=ancestor::*[.//button[@aria-label='Opções da transação']][1]"
            );
        await row
            .getByRole("button", { name: "Opções da transação" })
            .click();
        await page.getByRole("menuitem", { name: "Excluir" }).click();

        // O diálogo de confirmação deve se referir à transação certa.
        const dialog = page.getByRole("dialog");
        await expect(dialog).toContainText(title);

        // Confirmação: espera o DELETE completar antes de conferir a lista.
        const deleteResponse = page.waitForResponse(
            (r) =>
                r.request().method() === "DELETE" &&
                r.url().includes("/transactions/")
        );
        await dialog.getByRole("button", { name: "Excluir" }).click();
        await deleteResponse;

        await expect(page.getByText(title)).toHaveCount(0);
    });
});

async function createExpense(page: import("@playwright/test").Page, title: string) {
    await page.getByRole("button", { name: "Nova transação" })
            .or(page.getByRole("button", { name: "Nova", exact: true }))
            .first().click();
    await page.getByRole("button", { name: /Saída/ }).click();
    await page.getByLabel("Valor").fill("10");
    await page.getByLabel("Conta").selectOption({ index: 1 });
    await page
        .getByLabel("Categoria", { exact: true })
        .selectOption({ label: "+ Criar nova categoria de despesa" });
    await page
        .getByLabel("Nome da categoria")
        .fill(`QA Cat ${title} ${Date.now()}`);
    await page.getByRole("button", { name: "Criar categoria" }).click();
    await page
        .getByLabel("Forma de Pagamento", { exact: true })
        .selectOption({ label: "Pix" });
    await page.getByLabel("Data").fill(todayIso());
    await page.getByLabel(/Nome/, { exact: true }).fill(title);
    await page.getByRole("button", { name: "Salvar Transação" }).click();
}
