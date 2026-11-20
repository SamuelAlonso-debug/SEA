import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";
import { startMongo } from "./mongo";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;
const auth = `Bearer ${signToken({ userId: "507f1f77bcf86cd799439011", role: "ADMIN" })}`;
const id = "507f1f77bcf86cd799439099";

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());

type Method = "get" | "post" | "put" | "patch";
const send = (method: Method, url: string, body?: object) => {
  const req = request(app)[method](url).set("Authorization", auth);
  return body ? req.send(body) : req;
};

// Restos del texto por defecto de Zod en inglés.
const ENGLISH = /\b(invalid|expected|received|required|unrecognized|must|too (small|big))\b/i;

describe("400 de validación en español", () => {
  it("POST /api/products con {} → un issue en español por campo obligatorio", async () => {
    const res = await send("post", "/api/products", {}).expect(400);
    expect(res.body).toEqual({
      message: "Datos inválidos",
      issues: [
        { path: "name", message: "El nombre es obligatorio" },
        { path: "productCode", message: "El ID del producto es obligatorio" },
        { path: "price", message: "El precio es obligatorio" },
        { path: "cost", message: "El costo es obligatorio" },
        { path: "stock", message: "El stock es obligatorio" },
      ],
    });
  });

  const product = { name: "Arroz", productCode: "A1", price: 10, cost: 6, stock: 5 };
  const item = { productCode: "A1", quantity: 1 };
  const cash = { method: "CASH", amount: 116 };

  it.each([
    ["post", "/api/products", { ...product, price: "x" }, "price", "El precio debe ser un número"],
    ["post", "/api/products", { ...product, stock: 1.5 }, "stock", "El stock debe ser un número entero"],
    ["post", "/api/sales", { items: [], payments: [cash] }, "items", "Debe haber al menos un producto en la venta"],
    ["post", "/api/sales", { items: [{ ...item, quantity: 0 }], payments: [cash] }, "items.0.quantity", "La cantidad mínima es 1"],
    ["post", "/api/sales", { items: [item], payments: [{ method: "BTC", amount: 116 }] }, "payments.0.method", 'Opción inválida: se esperaba una de "CASH"|"CARD"|"TRANSFER"'],
    ["post", "/api/clients", { name: "Ana", lastname: "Ruiz", email: "x" }, "email", "Correo inválido"],
    ["get", "/api/products/abc", undefined, "id", "ID inválido"],
    ["post", "/api/products", { ...product, minStock: "x" }, "minStock", "Entrada inválida: se esperaba número, recibido texto"],
  ] as const)("%s %s, caso %#", async (method, url, body, path, message) => {
    const res = await send(method, url, body).expect(400);
    expect(res.body.issues).toContainEqual({ path, message });
  });

  // Un caso inválido por endpoint con body, params o query validados.
  it.each([
    ["post", "/api/auth/login", { email: 1 }],
    ["post", "/api/users", { name: 1 }],
    ["post", "/api/products", { name: 1, price: null, stock: "x", category: 5 }],
    ["put", `/api/products/${id}`, { price: "x" }],
    ["post", `/api/products/${id}/stock`, { quantity: "x" }],
    ["post", `/api/products/${id}/movements`, { type: 1, quantity: "x" }],
    ["get", `/api/products/${id}/movements?page=x`],
    ["get", "/api/clients?page=x&sortBy=1"],
    ["post", "/api/clients", { name: 1, lastname: null, phone: 5 }],
    ["put", `/api/clients/${id}`, { email: 5 }],
    ["post", "/api/sales", { items: "x", payments: 1 }],
    ["post", `/api/sales/${id}/cancel`, { reason: 1 }],
    ["get", "/api/sales/export?from=x"],
    ["get", "/api/expenses?page=x&category=1"],
    ["post", "/api/expenses", { concept: 1, amount: "x", date: 5 }],
    ["put", `/api/expenses/${id}`, { amount: "x" }],
    ["get", "/api/expenses/kpis?from=x&foo=1"],
    ["get", "/api/expenses/export?category=1"],
    ["get", "/api/kpis/header?period=x"],
    ["get", "/api/kpis/low-stock?foo=1"],
  ] as const)("%s %s → sin texto en inglés", async (method, url, body?: object) => {
    const res = await send(method, url, body).expect(400);
    expect(res.body.issues.length).toBeGreaterThan(0);
    for (const issue of res.body.issues) expect(issue.message).not.toMatch(ENGLISH);
  });
});
