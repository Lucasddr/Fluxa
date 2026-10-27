// @vitest-environment happy-dom
// Foco Sprints 4.5a-4.5e + refs de contrato: refresh único/concorrente,
// bypass em rotas de auth, retry único, expiração → /login, FormData sem
// Content-Type JSON.
import { api } from "@/services/api";

const BASE = "http://localhost:8080/api";

type LocationStub = {
    pathname: string;
    replace: ReturnType<typeof vi.fn>;
};

function stubLocation({ atLogin }: { atLogin: boolean }): LocationStub {
    const stub: LocationStub = {
        pathname: atLogin ? "/login" : "/home/transactions",
        replace: vi.fn(),
    };

    Object.defineProperty(window, "location", {
        configurable: true,
        value: stub,
    });

    return stub;
}

function stubFetch(handler: (url: string, init: RequestInit) => Response) {
    const calls: { url: string; init: RequestInit }[] = [];
    const handlerFn = (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return handler(url, init);
    };
    vi.stubGlobal("fetch", vi.fn(handlerFn));
    return calls;
}

function jsonResponse(status: number, body: Record<string, unknown> = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("api()", () => {
    it("respostas não-401 passam direto, sem refresh", async () => {
        const calls = stubFetch(() => jsonResponse(200, { ok: true }));
        const loc = stubLocation({ atLogin: false });

        const res = await api("/accounts/summary");

        expect(res.status).toBe(200);
        expect(calls).toHaveLength(1);
        expect(calls[0].url).toBe(`${BASE}/accounts/summary`);
        expect(loc.replace).not.toHaveBeenCalled();
    });

    it("401 em rotas de auth NUNCA dispara refresh (sem névoa de credencial)", async () => {
        const calls = stubFetch(() => jsonResponse(401));
        const loc = stubLocation({ atLogin: false });

        const res = await api("/auth/login", {
            method: "POST",
            body: JSON.stringify({}),
        });

        expect(res.status).toBe(401);
        expect(calls).toHaveLength(1); // nenhuma chamada de refresh extra
        expect(loc.replace).not.toHaveBeenCalled();
    });

    it("query string não quebra o bypass de auth", async () => {
        const calls = stubFetch(() => jsonResponse(401));
        stubLocation({ atLogin: false });

        await api("/auth/refresh?required=no");

        // /auth/refresh + /auth/login/…: 1 fetch e nada de segundo refresh
        expect(calls).toHaveLength(1);
    });

    it("401 sem bypass → refresh ok → retry único da request original", async () => {
        const calls = stubFetch((url) =>
            url === `${BASE}/auth/refresh`
                ? jsonResponse(200)
                : calls.length === 1
                  ? jsonResponse(401)
                  : jsonResponse(200, { data: 1 })
        );
        stubLocation({ atLogin: false });

        const res = await api("/transactions/list");

        expect(res.status).toBe(200);
        expect(calls).toHaveLength(3);
        expect(calls[1].url).toBe(`${BASE}/auth/refresh`);
        expect(calls[2].url).toBe(`${BASE}/transactions/list`);
        expect(calls[2].init.credentials).toBe("include");
    });

    it("retry único: segundo 401 não re-loop", async () => {
        const calls = stubFetch((url) =>
            url === `${BASE}/auth/refresh`
                ? jsonResponse(200)
                : jsonResponse(401)
        );
        stubLocation({ atLogin: false });

        const res = await api("/accounts/summary");

        expect(res.status).toBe(401);
        expect(
            calls.filter((c) => c.url === `${BASE}/auth/refresh`)
        ).toHaveLength(1);
        expect(calls).toHaveLength(3);
    });

    it("refresh falha → sem retry e expiração leva a /login", async () => {
        const calls = stubFetch(() => jsonResponse(401));
        const loc = stubLocation({ atLogin: false });

        const res = await api("/accounts/summary");

        expect(res.status).toBe(401);
        expect(calls.filter((c) => c.url.includes("/auth/refresh"))).toHaveLength(1);
        expect(loc.replace).toHaveBeenCalledWith("/login");
    });

    it("estando já no /login não redireciona de novo", async () => {
        stubFetch(() => jsonResponse(401));
        const loc = stubLocation({ atLogin: true });

        await api("/accounts/summary");

        expect(loc.replace).not.toHaveBeenCalled();
    });

    it("401s concorrentes compartilham UM refresh (4.5b)", async () => {
        const calls = stubFetch((url) =>
            url === `${BASE}/auth/refresh` ? jsonResponse(200) : jsonResponse(401)
        );
        stubLocation({ atLogin: false });

        const pending = [
            api("/accounts/summary"),
            api("/transactions/list"),
            api("/categories"),
        ];

        await Promise.all(pending);

        expect(
            calls.filter((c) => c.url === `${BASE}/auth/refresh`)
        ).toHaveLength(1);
    });

    it("FormData não recebe Content-Type JSON (upload multipart)", async () => {
        const calls = stubFetch(() => jsonResponse(200));
        stubLocation({ atLogin: false });

        const form = new FormData();
        form.append("file", new Blob(["csv,data"]), "extract.csv");

        await api("/accounts/1/statement-imports", {
            method: "POST",
            body: form,
        });

        const headers = new Headers(calls[0].init.headers);
        expect(headers.has("Content-Type")).toBe(false);
    });
});
