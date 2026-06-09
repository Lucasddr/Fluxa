const BASE_URL = "http://26.220.230.81:8080";

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