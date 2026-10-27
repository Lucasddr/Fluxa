import { chromium } from "@playwright/test";
import { prepareUserSession, stateFor } from "./sessions";

const USERS: Array<[string, string]> = [
    ["transactions", "QA Tx"],
    ["credit", "QA Crédito"],
    ["balance", "QA Saldo"],
    ["import", "QA Import"],
];

// Registro = 3/min por IP (bucket4j, refill ~1 token/20s): espaçamos os
// registros para não esbarrar no rate limit antes dos testes.
const REGISTER_SPACING_MS = 30_000;

export default async function globalSetup() {
    const browser = await chromium.launch();
    try {
        for (const [key, name] of USERS) {
            if (stateFor(key).exists()) continue;
            await prepareUserSession(browser, { name, fileKey: key });
            await new Promise((resolve) =>
                setTimeout(resolve, REGISTER_SPACING_MS)
            );
        }
    } finally {
        await browser.close();
    }
}
