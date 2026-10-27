import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export const PASSWORD = "qatester-1234";

export function uniqueEmail(prefix = "qa"): string {
    return `${prefix}-${Date.now()}-${Math.floor(
        Math.random() * 1000
    )}@test.local`;
}

export async function registerUser(
    page: Page,
    opts: { name?: string; email?: string } = {}
): Promise<string> {
    const email = opts.email ?? uniqueEmail();

    await page.goto("/register");
    await page.getByLabel("Nome").fill(opts.name ?? "QA Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Senha").fill(PASSWORD);
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByRole("status")).toContainText(
        "Conta criada com sucesso"
    );
    await page.waitForURL("**/login");
    return email;
}

export async function login(page: Page, email: string): Promise<void> {
    // Evita um reload desnecessário (e a corrida de reidratação que perde o
    // preenchimento) quando já estamos em /login, p.ex. após o redirect do
    // registro.
    if (!page.url().includes("/login")) {
        await page.goto("/login");
    }

    const emailField = page.getByLabel("Email");
    const passField = page.getByLabel("Senha");
    const submit = page.getByRole("button", { name: "Entrar" });

    // Preenche (de novo, se preciso) até o formulário aceitar: protege contra
    // reset de hidratação do dev server que esvazia os campos.
    for (let attempt = 0; attempt < 3; attempt++) {
        await emailField.fill(email);
        await passField.fill(PASSWORD);
        if (await submit.isEnabled()) break;
        await page.waitForTimeout(500);
    }
    await expect(submit).toBeEnabled();
    await submit.click();

    await page.waitForURL("**/home");
    await expect(page.getByText(/^Olá,/)).toBeVisible();
}

export async function registerAndLogin(
    page: Page,
    opts: { name?: string; email?: string } = {}
): Promise<string> {
    const email = await registerUser(page, opts);
    await login(page, email);
    return email;
}

export async function logout(page: Page): Promise<void> {
    await page
        .getByRole("button", { name: "Abrir menu do usuário" })
        .click();
    // MenuListModal usa Radix DropdownMenu: os itens são role=menuitem.
    // O logout exige o cookie refresh_token (sem ele o backend responde 400
    // e a sessão NÃO é encerrada) — por isso conferimos o resultado.
    const logoutResponse = page.waitForResponse(
        (r) => r.url().includes("/api/auth/logout")
    );
    await page.getByRole("menuitem", { name: "Sair" }).click();
    const response = await logoutResponse;
    expect(response.status(), "logout deve encerrar a sessão (200)").toBe(200);
    await page.waitForURL("**/login");
}
