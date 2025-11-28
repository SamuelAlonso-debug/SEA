"use client";

import { apiClient } from "@/lib/api-client";

const TOKEN_KEY = "sea_token";
const USER_KEY = "sea_user";

export function saveToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function saveUser(user: any) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): any | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
}

export async function loginRequest(email: string, password: string) {
  const res: any = await apiClient.post("/auth/login", {
    body: { email, password },
  });

  // Guarda token y usuario
  if (res.token) saveToken(res.token);
  if (res.user) saveUser(res.user);

  return res;
}

export async function registerRequest(data: {
  name: string;
  lastname: string;
  email: string;
  password: string;
}) {
  // devolvemos la respuesta pero no guardamos nada en localStorage
  return apiClient.post("/auth/register", {
    body: data,
  });
}
