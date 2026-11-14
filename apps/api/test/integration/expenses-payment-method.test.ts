import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";
import { startMongo } from "./mongo";
import { migrate } from "../../prisma/migrate-expense-payment-method.mjs";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;
const auth = `Bearer ${signToken({ userId: "507f1f77bcf86cd799439011" })}`;

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());
beforeEach(() => db.reset());

const base = { concept: "Luz", category: "service", amount: 100 };
const create = (body: object) => request(app).post("/api/expenses").set("Authorization", auth).send(body);

describe("método de pago de gastos", () => {
  it("migración: texto libre → catálogo, idempotente", async () => {
    const now = { $date: new Date().toISOString() };
    const doc = (paymentMethod?: string) => ({
      ...base, date: now, createdAt: now, updatedAt: now, ...(paymentMethod !== undefined && { paymentMethod }),
    });
    await db.prisma.$runCommandRaw({
      insert: "Expense",
      documents: [doc("Efectivo"), doc("efectivo"), doc(" Tarjeta de Crédito"), doc()],
    });

    const blocked = await migrate(db.prisma);
    expect(blocked).toMatchObject({ applied: false, unknown: [{ value: null, count: 1 }] });

    expect((await migrate(db.prisma, { fallback: "CASH" })).applied).toBe(true);
    const methods = (await db.prisma.expense.findMany()).map((e) => e.paymentMethod).sort();
    expect(methods).toEqual(["CARD", "CASH", "CASH", "CASH"]);

    expect(await migrate(db.prisma)).toEqual({ plan: [], unknown: [], applied: true });
  });

  it("alta, edición y KPI por método", async () => {
    const cash = await create({ ...base, paymentMethod: "CASH" }).expect(201);
    await create({ ...base, amount: 50, paymentMethod: "CARD" }).expect(201);
    await request(app).put(`/api/expenses/${cash.body.id}`).set("Authorization", auth).send({ paymentMethod: "TRANSFER" }).expect(200);

    const kpis = await request(app).get("/api/expenses/kpis").set("Authorization", auth).expect(200);
    expect(kpis.body.totalByPaymentMethod).toEqual([
      { paymentMethod: "CASH", amount: 0 },
      { paymentMethod: "CARD", amount: 50 },
      { paymentMethod: "TRANSFER", amount: 100 },
    ]);
  });

  it.each([
    [base, "El método de pago es obligatorio"],
    [{ ...base, paymentMethod: "Efectivo" }, 'Opción inválida: se esperaba una de "CASH"|"CARD"|"TRANSFER"'],
  ])("400 con %j", async (body, message) => {
    const res = await create(body).expect(400);
    expect(res.body.errors).toContainEqual(expect.objectContaining({ path: ["paymentMethod"], message }));
  });
});
