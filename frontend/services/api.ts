const BASE_URL = "http://localhost:8080";

export async function api(path : string, options : RequestInit = {}) {

    const token = localStorage.getItem("token");

    return fetch (`${BASE_URL}${path}`,{
        ...options,
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers
    }})
}