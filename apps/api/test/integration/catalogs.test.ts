import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";
import { startMongo } from "./mongo";

let db: Awaited<ReturnType<typeof startMongo>>;
const auth = `Bearer ${signToken({ userId: "507f1f77bcf86cd799439011", role: "ADMIN" })}`;

beforeAll(async () => {
  db = await startMongo();
}, 300_000);

afterAll(() => db?.stop());

describe("GET /api/catalogs", () => {
  it("devuelve categorías y métodos de pago con etiqueta en español", async () => {
    const res = await request(db.app).get("/api/catalogs").set("Authorization", auth).expect(200);
    expect(res.body.expenseCategories).toEqual([
      { value: "service", label: "Servicios" },
      { value: "merchandise", label: "Mercancía" },
      { value: "maintenance", label: "Mantenimiento" },
      { value: "rent", label: "Renta" },
      { value: "payroll", label: "Nómina" },
      { value: "tax", label: "Impuestos" },
      { value: "other", label: "Otros" },
    ]);
    expect(res.body.paymentMethods).toEqual([
      { value: "CASH", label: "Efectivo" },
      { value: "CARD", label: "Tarjeta" },
      { value: "TRANSFER", label: "Transferencia" },
    ]);
  });

  it("401 sin token", async () => {
    await request(db.app).get("/api/catalogs").expect(401);
  });
});
