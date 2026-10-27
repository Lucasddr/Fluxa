import { defineConfig, devices } from "@playwright/test";

// Fase 5 do plano QA: E2E contra o stack local do nginx/docker-compose.yml
// (postgres dev + backend :8080) + o proxy do nginx/docker-compose.nginx.yml
// (:80) + o dev server Next (3000, host). O app browse http://localhost -
// a base .env.local (NEXT_PUBLIC_API_URL=http://localhost/api) bate no proxy.

export default defineConfig({
    testDir: "./e2e",
    globalSetup: "./e2e/global-setup.ts",
    timeout: 90_000,
    expect: { timeout: 15_000 },
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    reporter: [["list"]],
    use: {
        baseURL: "http://localhost",
        trace: "retain-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: [
        {
            // `docker compose up -d --wait` às vezes devolve exit 1 no Windows
            // mesmo com todos os containers healthy (restart do engine). O
            // wrapper engole o exit do compose e só devolve 0 quando a porta
            // do backend responde de verdade (poll TCP).
            command:
                'powershell -NoProfile -Command "docker compose -f ../docker-compose.yml up -d --wait *> $null; $ok=$false; for($i=0;$i -lt 90;$i++){ if((Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue).TcpTestSucceeded){$ok=$true;break}; Start-Sleep 2 }; if($ok){exit 0}else{exit 1}"',
            url: "http://localhost:8080/actuator/health",
            timeout: 300_000,
            reuseExistingServer: true,
        },
        {
            command: "npm run dev",
            url: "http://localhost:3000",
            timeout: 300_000,
            reuseExistingServer: true,
        },
    ],
});
