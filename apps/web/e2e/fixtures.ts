import { expect, type APIRequestContext } from "@playwright/test";

export const API_URL = "http://localhost:4100/api";
export const USER = { name: "Ana", lastname: "Pruebas", email: "e2e@sea.test", password: "E2e-pass-123" };
export const AUTH_FILE = "e2e/.auth.json";

// `page.request` comparte las cookies del navegador: el seed va con la misma sesión que la UI.

// Producto único por test: el stock y el código nunca se comparten entre specs.
export async function seedProduct(request: APIRequestContext, stock: number) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const data = { name: `Producto E2E ${suffix}`, productCode: `E2E${suffix}`, price: 100, cost: 60, stock };
  const res = await request.post(`${API_URL}/products`, { data });
  expect(res.ok()).toBeTruthy();
  return { ...data, id: (await res.json()).id as string };
}

// Limpieza: baja lógica del producto sembrado.
export async function removeProduct(request: APIRequestContext, id: string) {
  await request.delete(`${API_URL}/products/${id}`);
}
