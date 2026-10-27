import {
    listTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
} from "@/services/transactions";

const BASE = "http://localhost:8080/api";

function stubFetch(handler: (url: string, init: RequestInit) => Response) {
    const calls: { url: string; init: RequestInit }[] = [];
    const handlerFn = (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return handler(url, init);
    };
    vi.stubGlobal("fetch", vi.fn(handlerFn));
    return calls;
}

afterEach(() => {
    vi.unstubAllGlobals();
});

function ok() {
    return new Response("{}", { status: 200 });
}

describe("services/transactions", () => {
    it("lista e leitura individual usam GET com cookies", async () => {
        const calls = stubFetch(() => ok());

        await listTransactions();
        await getTransaction("abc-1");

        expect(calls[0].url).toBe(`${BASE}/transactions/list`);
        expect(calls[0].init.method).toBeUndefined(); // GET é o default
        expect(calls[0].init.credentials).toBe("include");
        expect(calls[1].url).toBe(`${BASE}/transactions/abc-1`);
    });

    it("create envia POST com corpo JSON estruturado", async () => {
        const calls = stubFetch(() => new Response("{}", { status: 201 }));

        await createTransaction({ amount: 10, description: "café" });

        expect(calls[0].url).toBe(`${BASE}/transactions/create`);
        expect(calls[0].init.method).toBe("POST");
        expect(JSON.parse(String(calls[0].init.body))).toEqual({
            amount: 10,
            description: "café",
        });
        const headers = new Headers(calls[0].init.headers);
        expect(headers.get("Content-Type")).toBe("application/json");
        expect(headers.has("Idempotency-Key")).toBe(false);
    });

    it("create com idempotencyKey adiciona o header (sem romper corpo)", async () => {
        const calls = stubFetch(() => new Response("{}", { status: 201 }));

        await createTransaction({ amount: 10 }, "short-key");

        const headers = new Headers(calls[0].init.headers);
        expect(headers.get("Idempotency-Key")).toBe("short-key");
    });

    it("update usa PATCH e remove usa DELETE no mesmo recurso", async () => {
        const calls = stubFetch(() => ok());

        await updateTransaction("t-1", { description: "nova" });
        await deleteTransaction("t-1");

        expect(calls[0].url).toBe(`${BASE}/transactions/t-1`);
        expect(calls[0].init.method).toBe("PATCH");
        expect(calls[1].url).toBe(`${BASE}/transactions/t-1`);
        expect(calls[1].init.method).toBe("DELETE");
    });
});
