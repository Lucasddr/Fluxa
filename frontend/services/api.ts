const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL não foi definida no .env.local")
}

export async function api(
    path: string,
    options: RequestInit = {}
) {
    return fetch(`${BASE_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
        "Content-Type": "application/json",
        ...options.headers,
        },
    });
}