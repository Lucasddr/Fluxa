import fs from "node:fs";
import path from "node:path";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import { registerAndLogin } from "./helpers";

// Registro tem rate limit de 3/min por IP no backend (RateLimitService).
// Cada spec-file cria UM usuário no beforeAll e distribui a sessão para os
// testes via storageState; o auth.spec é o único com registros múltiplos.

const STATE_DIR = path.join(process.cwd(), "test-results", "session-state");

export async function prepareUserSession(
    browser: Browser,
    opts: { name: string; fileKey: string }
): Promise<void> {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    const statePath = path.join(STATE_DIR, `${opts.fileKey}.json`);

    const context: BrowserContext = await browser.newContext({
        baseURL: "http://localhost",
    });
    const page: Page = await context.newPage();
    await registerAndLogin(page, { name: opts.name });
    await context.storageState({ path: statePath });
    await context.close();
}

export function stateFor(fileKey: string) {
    const statePath = path.join(STATE_DIR, `${fileKey}.json`);
    return {
        storageState: statePath,
        exists: () => fs.existsSync(statePath),
    };
}
