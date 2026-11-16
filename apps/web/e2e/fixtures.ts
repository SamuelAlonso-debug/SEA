import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const API_URL = "http://localhost:4100/api";
export const USER = { name: "Ana", lastname: "Pruebas", email: "e2e@sea.test", password: "E2e-pass-123" };
export const AUTH_FILE = "e2e/.auth.json";

// Producto único por test: el stock y el código nunca se comparten entre specs.
export async function seedProduct(request: APIRequestContext, token: string, stock: number) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const data = { name: `Producto E2E ${suffix}`, productCode: `E2E${suffix}`, price: 100, cost: 60, stock };
  const res = await request.post(`${API_URL}/products`, { data, headers: { Authorization: `Bearer ${token}` } });
  expect(res.ok()).toBeTruthy();
  return { ...data, id: (await res.json()).id as string };
}

// Limpieza: baja lógica del producto sembrado.
export async function removeProduct(request: APIRequestContext, token: string, id: string) {
  await request.delete(`${API_URL}/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
}

export const tokenOf = (page: Page) => page.evaluate(() => localStorage.getItem("sea_token")!);
