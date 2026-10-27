import { test, expect } from "@playwright/test";
import {
    registerUser,
    login,
    logout,
    PASSWORD,
} from "./helpers";

// Registro tem rate limit de 3/min por IP: esta spec é a única com registros
// múltiplos (3 no máximo) e os demais specs reusam sessão via storageState.
test.describe.configure({ mode: "serial" });

test.describe("autenticação ponta a ponta", () => {
    test("registro cria conta e redireciona para login", async ({ page }) => {
        const email = await registerUser(page, { name: "QA Auth" });

        expect(email).toContain("@test.local");
        await expect(page).toHaveURL(/\/login/);
    });

    test("login entra no dashboard; logout via menu volta ao login; cookies de sessão existem", async ({
        page,
    }) => {
        const email = await registerUser(page, { name: "QA Sessão" });
        await login(page, email);

        const cookies = await page.context().cookies(
            "http://localhost/api/auth"
        );
        const names = cookies.map((c) => c.name.toLowerCase());
        expect(
            names.includes("access_token") && names.includes("refresh_token"),
            `cookies: ${names.join(", ")}`
        ).toBe(true);

        await logout(page);

        await expect(page).toHaveURL(/\/login/);

        // Re-login prova persistência e ciclo completo.
        await login(page, email);
        await expect(page.getByText("Olá, QA Sessão")).toBeVisible();
        await logout(page);
    });

    test("login com senha errada mostra erro e não entra", async ({ page }) => {
        const email = await registerUser(page, { name: "QA Erro" });

        await page.goto("/login");
        await page.getByLabel("Email").fill(email);
        await page.getByLabel("Senha").fill("errada-999");
        await page.getByRole("button", { name: "Entrar" }).click();

        await expect(page.getByRole("alert")).toBeVisible();
        await expect(page).toHaveURL(/\/login/);
    });

    test("rotas protegidas rejeitam sessão inexistente", async ({ page }) => {
        await page.goto("/home/transactions");
        await expect(page).toHaveURL(/\/login/);
    });
});

void PASSWORD;
