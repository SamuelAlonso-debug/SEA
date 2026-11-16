import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";
import { startMongo } from "./mongo";

let db: Awaited<ReturnType<typeof startMongo>>;
let auth: string;

beforeAll(async () => {
  db = await startMongo();
}, 300_000);

afterAll(() => db?.stop());

beforeEach(async () => {
  await db.reset();
  const user = await db.prisma.user.create({ data: { name: "C", lastname: "C", email: "c@c.mx", password: "x", role: "ADMIN" } });
  auth = `Bearer ${signToken({ userId: user.id, role: "ADMIN" })}`;
  await db.prisma.product.create({ data: { name: "A", productCode: "A", price: 100, stock: 5 } });
});

const items = [{ productCode: "A", quantity: 1 }]; // total 116
const sell = (payments: unknown) => request(db.app).post("/api/sales").set("Authorization", auth).send({ items, payments });
const paymentKpis = async () =>
  (await request(db.app).get("/api/kpis/payment-methods").set("Authorization", auth).expect(200)).body.current;

describe("POST /api/sales con pagos", () => {
  it("116 = CASH 100 (recibe 200) + TRANSFER 16 → cambio 100, dos pagos y KPI por pago", async () => {
    const res = await sell([
      { method: "CASH", amount: 100, received: 200 },
      { method: "TRANSFER", amount: 16, reference: "SPEI-123" },
    ]).expect(201);

    expect(res.body).toMatchObject({
      total: 116,
      change: 100,
      payments: [
        { method: "CASH", amount: 100, received: 200, change: 100, reference: null },
        { method: "TRANSFER", amount: 16, received: null, change: null, reference: "SPEI-123" },
      ],
    });
    expect((await db.prisma.sale.findFirst())!.payments).toHaveLength(2);

    const kpis = await paymentKpis();
    expect(kpis.sort((a: any, b: any) => a.paymentMethod.localeCompare(b.paymentMethod))).toEqual([
      { paymentMethod: "CASH", totalSalesAmount: 100, count: 1 },
      { paymentMethod: "TRANSFER", totalSalesAmount: 16, count: 1 },
    ]);
  });

  it.each([
    [[], ["payments"], "Debe haber al menos un pago"],
    [[{ method: "CHEQUE", amount: 116 }], ["payments", 0, "method"], 'Opción inválida: se esperaba una de "CASH"|"CARD"|"TRANSFER"'],
    [[{ method: "CASH", amount: 0 }], ["payments", 0, "amount"], "El monto del pago debe ser mayor a 0"],
    [[{ method: "CASH", amount: 100 }], ["payments"], "Los pagos suman 100.00 y el total es 116.00"],
    [[{ method: "CASH", amount: 116, received: 100 }], ["payments", 0, "received"], "El efectivo recibido no cubre el pago"],
    [[{ method: "CARD", amount: 116, received: 200 }], ["payments", 0, "received"], "Solo los pagos en efectivo llevan monto recibido"],
  ])("400 con %j; sin venta ni stock descontado", async (payments, path, message) => {
    const res = await sell(payments).expect(400);
    expect(res.body.errors).toContainEqual(expect.objectContaining({ path, message }));
    expect(await db.prisma.sale.count()).toBe(0);
    expect(await db.prisma.saleItem.count()).toBe(0);
    expect((await db.prisma.product.findUnique({ where: { productCode: "A" } }))!.stock).toBe(5);
  });
});

describe("ventas previas a #82 (sin pagos)", () => {
  beforeEach(async () => {
    // Documento tal como lo dejaba la API anterior: sin el campo payments.
    const now = { $date: new Date().toISOString() };
    await db.prisma.$runCommandRaw({
      insert: "Sale",
      documents: [{ ticketNumber: "0000001", subtotal: 50, tax: 8, total: 58, paymentMethod: "CARD", createdAt: now, updatedAt: now }],
    });
  });

  it("aparecen en KPIs por su método y en el listado con un pago por el total", async () => {
    await sell([{ method: "CARD", amount: 116 }]).expect(201);
    expect(await paymentKpis()).toEqual([{ paymentMethod: "CARD", totalSalesAmount: 174, count: 2 }]);

    const list = await request(db.app).get("/api/sales").set("Authorization", auth).expect(200);
    expect(list.body.find((s: any) => s.ticketNumber === "0000001")).toMatchObject({
      paymentMethod: "CARD",
      change: 0,
      payments: [{ method: "CARD", amount: 58, received: null, change: null, reference: null }],
    });
  });
});
