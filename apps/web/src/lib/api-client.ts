// src/lib/api-client.ts
const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, ""); // sin / al final

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${cleanPath}`);

  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
    });
  }

  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query } = options;

  const url = buildUrl(path, query);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // La sesión viaja en la cookie httpOnly de la API (otro origen): hay que pedir que se envíe.
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  // Sesión vencida o cerrada: al login en lugar de dejar el dashboard roto.
  // Las rutas /auth/* (login, perfil del guard) resuelven su propio 401.
  if (res.status === 401 && !path.startsWith("/auth/") && typeof window !== "undefined") {
    window.location.assign("/auth/login");
  }

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const data = await res.json();
      msg = (data as { message?: string }).message || msg;
    } catch {}
    throw new Error(msg);
  }

  // 204 (logout) no trae cuerpo.
  return res.status === 204 ? (undefined as T) : res.json();
}

export const apiClient = {
  get:  <T>(path: string, options?: Omit<RequestOptions, "method">) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, options?: Omit<RequestOptions, "method">) =>
    request<T>(path, { ...options, method: "POST" }),
  put:  <T>(path: string, options?: Omit<RequestOptions, "method">) =>
    request<T>(path, { ...options, method: "PUT" }),
  patch: <T>(path: string, options?: Omit<RequestOptions, "method">) =>
    request<T>(path, { ...options, method: "PATCH" }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "method">) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
