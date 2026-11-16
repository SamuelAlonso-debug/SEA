import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";
import { startMongo } from "./mongo";

let db: Awaited<ReturnType<typeof startMongo>>;
let auth: string;
let userId: string;

beforeAll(async () => {
  db = await startMongo();
}, 300_000);

afterAll(() => db?.stop());

beforeEach(async () => {
  await db.reset();
  const user = await db.prisma.user.create({ data: { name: "C", lastname: "C", email: "c@c.mx", password: "x" } });
  userId = user.id;
  auth = `Bearer ${signToken({ userId })}`;
  await db.prisma.product.create({ data: { name: "Prod A1", productCode: "A1", price: 100, stock: 10 } });
});

const sellTwo = async () =>
  (
    await request(db.app)
      .post("/api/sales")
      .set("Authorization", auth)
      .send({ items: [{ productCode: "A1", quantity: 2 }], paymentMethod: "CASH" })
      .expect(201)
  ).body;
const cancel = (id: string, body: object = { reason: "Devolución total" }) =>
  request(db.app).post(`/api/sales/${id}/cancel`).set("Authorization", auth).send(body);
const kpi = async (path: string) =>
  (await request(db.app).get(`/api/kpis/${path}`).set("Authorization", auth).expect(200)).body;
const stock = async () => (await db.prisma.product.findUnique({ where: { productCode: "A1" } })).stock;

describe("POST /api/sales/:id/cancel", () => {
  it("cancela, reintegra el stock y registra quién y cuándo", async () => {
    const sale = await sellTwo();
    expect(await stock()).toBe(8);

    const res = await cancel(sale.id).expect(200);
    expect(res.body).toMatchObject({ status: "CANCELLED", cancelReason: "Devolución total", ticketNumber: sale.ticketNumber });
    expect(res.body.cancelledAt).toBeTruthy();
    expect(await stock()).toBe(10);
    expect(await db.prisma.sale.findUnique({ where: { id: sale.id } })).toMatchObject({ cancelledById: userId });
  });

  it("la venta cancelada deja de contar en los KPIs", async () => {
    const sale = await sellTwo();
    expect((await kpi("header")).current.totalSalesAmount).toBe(232);

    await cancel(sale.id).expect(200);
    expect((await kpi("header")).current).toMatchObject({ totalSalesAmount: 0, totalTransactions: 0, totalProductsSold: 0 });
    expect((await kpi("payment-methods")).current).toEqual([]);
    expect(await kpi("top-products")).toMatchObject({ current: [] });
    expect((await kpi("summary")).current).toMatchObject({ todayRevenue: 0, todaySalesCount: 0 });
  });

  it("una venta previa sin `status` cuenta en KPIs y se puede cancelar", async () => {
    const sale = await sellTwo();
    await db.prisma.$runCommandRaw({ update: "Sale", updates: [{ q: {}, u: { $unset: { status: "" } } }] });
    expect((await kpi("header")).current.totalSalesAmount).toBe(232);

    await cancel(sale.id).expect(200);
    expect(await stock()).toBe(10);
  });

  it("dos cancelaciones simultáneas → un 200 y un 409; stock reintegrado una vez", async () => {
    const sale = await sellTwo();
    const res = await Promise.all([cancel(sale.id), cancel(sale.id)]);
    expect(res.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(res.find((r) => r.status === 409)!.body.message).toBe("La venta ya está cancelada");
    expect(await stock()).toBe(10);
  });

  it("cancelar una venta ya cancelada → 409 sin tocar el stock", async () => {
    const sale = await sellTwo();
    await cancel(sale.id).expect(200);
    const res = await cancel(sale.id).expect(409);
    expect(res.body.message).toBe("La venta ya está cancelada");
    expect(await stock()).toBe(10);
  });

  it.each([
    ["sin motivo", {}, "El motivo es obligatorio"],
    ["motivo vacío", { reason: "" }, "El motivo es obligatorio"],
    ["motivo en blanco", { reason: "   " }, "El motivo es obligatorio"],
    ["motivo > 255", { reason: "x".repeat(256) }, "El motivo no puede tener más de 255 caracteres"],
  ])("%s → 400 sin tocar el stock", async (_, body, message) => {
    const sale = await sellTwo();
    const res = await cancel(sale.id, body).expect(400);
    expect(res.body.message).toBe(message);
    expect(await stock()).toBe(8);
  });

  it.each([
    ["id que no es ObjectId", "abc", 400, "ID inválido"],
    ["venta inexistente", "507f1f77bcf86cd799439011", 404, "Venta no encontrada"],
  ])("%s → %i", async (_, id, status, message) => {
    await sellTwo();
    const res = await cancel(id).expect(status);
    expect(res.body.message).toBe(message);
    expect(await stock()).toBe(8);
  });
});
