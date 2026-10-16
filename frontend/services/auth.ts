import { api } from "./api";

type Credentials = {
  email: string;
  password: string;
};

type Registration = {
  name: string;
  email: string;
  password: string;
};

function json(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

export function login(input: Credentials): Promise<Response> {
  return api("/auth/login", json("POST", input));
}

export function register(input: Registration): Promise<Response> {
  return api("/auth/register", json("POST", input));
}

export function logout(): Promise<Response> {
  return api("/auth/logout", { method: "POST" });
}

export function me(): Promise<Response> {
  return api("/auth/me");
}

export function forgotPassword(email: string): Promise<Response> {
  return api("/auth/forgot-password", json("POST", { email }));
}

export function resetPassword(
  token: string,
  password: string
): Promise<Response> {
  return api("/auth/reset-password", json("POST", { token, password }));
}

export function sendVerification(): Promise<Response> {
  return api("/auth/send-verification", { method: "POST" });
}

export function verifyEmail(token: string): Promise<Response> {
  return api(`/auth/verify-email?token=${encodeURIComponent(token)}`);
}
