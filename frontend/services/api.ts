const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL não foi definida no .env.local")
}

// Endpoints de autenticação que NUNCA disparam refresh:
// - /auth/login e /auth/register: 401 aqui significa credencial inválida,
//   não sessão expirada.
// - /auth/refresh: o próprio refresh não pode se auto-disparar (4.5d).
const NO_REFRESH_PATHS = [
    "/auth/login",
    "/auth/register",
    "/auth/registerAdmin",
    "/auth/refresh",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/send-verification",
    "/auth/verify-email",
];

// Promise compartilhada do refresh em andamento (4.5b):
// 401s concorrentes aguardam o MESMO refresh em vez de disparar vários.
let refreshPromise: Promise<boolean> | null = null;

function shouldBypassRefresh(path: string): boolean {
    const clean = path.split("?")[0];
    return NO_REFRESH_PATHS.some(
        (p) => clean === p || clean.startsWith(p + "/")
    );
}

async function doRefresh(): Promise<boolean> {
    try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include",
        });

        return res.ok;
    } catch {
        return false;
    }
}

function ensureFreshSession(): Promise<boolean> {
    if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

function handleSessionExpired(): void {
    if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login")
    ) {
        // Full reload is intentional here: it drops all client-side
        // session state. Replace (instead of assign) avoids
        // back-navigation into the dead session.
        window.location.replace("/login");
    }
}

function rawFetch(path: string, options: RequestInit): Promise<Response> {
    return fetch(`${BASE_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
}

export async function api(
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    const res = await rawFetch(path, options);

    if (res.status !== 401 || shouldBypassRefresh(path)) {
        return res;
    }

    const refreshed = await ensureFreshSession();

    if (!refreshed) {
        handleSessionExpired();

        return res;
    }

    // Retry único da request original com os cookies renovados (4.5c).
    return rawFetch(path, options);
}
