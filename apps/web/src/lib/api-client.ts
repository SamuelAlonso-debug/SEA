// src/lib/api-client.ts
const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, ""); // sin / al final

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: Method;
  body?: unknown;
  token?: string | null;
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

// Token vencido o inválido: se borra la sesión y se vuelve al login en lugar de dejar el dashboard roto.
function expireSession(res: Response, token?: string | null) {
  if (res.status === 401 && token && typeof window !== "undefined") {
    localStorage.removeItem("sea_token");
    localStorage.removeItem("sea_user");
    window.location.assign("/auth/login");
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, query } = options;

  const url = buildUrl(path, query);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  expireSession(res, token);

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const data = await res.json();
      msg = (data as { message?: string }).message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

// Descarga un archivo (CSV) con el nombre que manda el servidor en Content-Disposition.
async function download(path: string, options: Pick<RequestOptions, "token" | "query"> = {}): Promise<void> {
  const headers: HeadersInit = {};
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;
  const res = await fetch(buildUrl(path, options.query), { headers });

  expireSession(res, options.token);
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      msg = ((await res.json()) as { message?: string }).message || msg;
    } catch {}
    throw new Error(msg);
  }

  const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "exportacion.csv";
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export const apiClient = {
  download,
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
