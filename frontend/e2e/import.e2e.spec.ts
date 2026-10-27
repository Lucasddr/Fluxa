import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { prepareUserSession, stateFor } from "./sessions";

const SESSION = stateFor("import");
test.use({ storageState: SESSION.storageState });

const RESULTS_DIR = path.join(process.cwd(), "test-results");

let csvPath = "";
let marketDesc = "";
let salaryDesc = "";

test.describe("importação de extrato (UI real, viewport móvel)", () => {
    test.beforeAll(async ({ browser }) => {
        if (!SESSION.exists()) {
            await prepareUserSession(browser, {
                name: "QA Import",
                fileKey: "import",
            });
        }

        // CSV único por execução: imuniza o dedupe contra dados de runs
        // anteriores (descrições E datas dinâmicas cobrem qualquer chave de
        // duplicidade que o backend use).
        fs.mkdirSync(RESULTS_DIR, { recursive: true });
        const stamp = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        marketDesc = `SUPERMERCADO ABC ${stamp}`;
        salaryDesc = `SALARIO OUTUBRO ${stamp}`;
        csvPath = path.join(RESULTS_DIR, `statement-${stamp}.csv`);

        const day = (offset: number) => {
            const d = new Date();
            d.setDate(d.getDate() + offset);
            return d.toISOString().slice(0, 10);
        };

        fs.writeFileSync(
            csvPath,
            [
                "data;descricao;valor",
                `${day(-1)};${marketDesc};48,90`,
                `${day(0)};${salaryDesc};2500,00`,
                "",
            ].join("\n"),
            "utf8"
        );
    });

    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/home/bank-accounts");
        await expect(
            page.getByRole("button", { name: "Importar extrato" }).first()
        ).toBeVisible();
    });

    test("prévia mostra linhas parseadas e importação cria transações", async ({
        page,
    }) => {
        await openImportDialog(page);
        await page.setInputFiles("#statement-file", csvPath);
        await page.getByRole("button", { name: /^Ver prévia/i }).click();

        await expect(
            page.getByText(/Prévia do arquivo/i)
        ).toBeVisible({ timeout: 30_000 });

        // As linhas da prévia são inputs editáveis (Descrição = textbox).
        const descriptions = page.locator(
            "input[id^='statement-description-']"
        );
        await expect(descriptions).toHaveCount(2, { timeout: 30_000 });
        await expect(descriptions.nth(0)).toHaveValue(marketDesc);
        await expect(descriptions.nth(1)).toHaveValue(salaryDesc);

        await page
            .getByRole("button", { name: "Importar 2 movimentações" })
            .click();

        await expect(page.getByText("Importação concluída")).toBeVisible({
            timeout: 30_000,
        });

        // A lista esconde a descrição em viewport estreito: confere em desktop.
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto("/home/transactions");
        await expect(
            page.getByText(marketDesc).first()
        ).toBeVisible({ timeout: 30_000 });
        await expect(page.getByText(salaryDesc).first()).toBeVisible();
    });

    test("reimportar o mesmo arquivo marca duplicatas e não importa nada", async ({
        page,
    }) => {
        await openImportDialog(page);
        await page.setInputFiles("#statement-file", csvPath);
        await page.getByRole("button", { name: /^Ver prévia/i }).click();

        await expect(
            page.getByText(/Prévia do arquivo/i)
        ).toBeVisible({ timeout: 30_000 });

        // As duas linhas viram duplicadas; será ignorada.
        await expect(
            page.getByText(/Duplicada ou já importada/i).first()
        ).toBeVisible({ timeout: 30_000 });
        await expect(
            page.getByText(/duplicadas ou já importadas/i).first()
        ).toBeVisible();

        // Sem selecionáveis, o botão de importar fica desabilitado em 0.
        const importButton = page.getByRole("button", {
            name: "Importar 0 movimentações",
        });
        await expect(importButton).toBeDisabled();
    });
});

async function openImportDialog(
    page: import("@playwright/test").Page
): Promise<void> {
    await page
        .getByRole("button", { name: "Importar extrato" })
        .first()
        .click();
    await expect(
        page.getByRole("heading", { name: /Importar extrato/i })
    ).toBeVisible();
}
