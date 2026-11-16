import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";
import { startMongo } from "./mongo";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;
const auth = `Bearer ${signToken({ userId: "507f1f77bcf86cd799439011", role: "ADMIN" })}`;
const get = (url: string) => request(app).get(url).set("Authorization", auth);

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());
beforeEach(() => db.reset());

const OCT = "?from=2026-10-01&to=2026-10-31";

let n = 0;
const sale = async (createdAt: string, subtotal: number, items: { quantity: number; unitCost: number | null }[]) => {
  const p = await db.prisma.product.create({ data: { name: `P${++n}`, productCode: `P${n}`, price: 10, stock: 0 } });
  return db.prisma.sale.create({
    data: {
      ticketNumber: String(n),
      subtotal,
      tax: 0,
      total: subtotal,
      paymentMethod: "CASH",
      createdAt: new Date(createdAt),
      items: { create: items.map((i) => ({ ...i, productId: p.id, unitPrice: 10, subtotal: 10 * i.quantity })) },
    },
  });
};
const expense = (date: string, category: string, amount: number) =>
  db.prisma.expense.create({ data: { concept: "G", category: category as any, amount, paymentMethod: "CASH", date: new Date(date) } });

describe("GET /api/kpis/profit", () => {
  it("utilidad de octubre con comparativo de septiembre", async () => {
    await sale("2026-10-10T12:00:00-06:00", 1000, [{ quantity: 3, unitCost: 200 }]);
    await expense("2026-10-05T10:00:00-06:00", "rent", 250);
    await expense("2026-10-06T10:00:00-06:00", "merchandise", 600); // ya está en el costo
    await sale("2026-09-30T23:00:00-06:00", 500, [{ quantity: 1, unitCost: 100 }]); // último día de sep, hora local

    const res = await get(`/api/kpis/profit${OCT}`).expect(200);
    expect(res.body).toMatchObject({
      period: { from: "2026-10-01", to: "2026-10-31" },
      previousPeriod: { from: "2026-09-01", to: "2026-09-30" },
      current: { netSales: 1000, costOfGoodsSold: 600, grossProfit: 400, expenses: 250, netProfit: 150, marginPct: 15, warnings: [] },
      previous: { netSales: 500, costOfGoodsSold: 100, netProfit: 400, marginPct: 80 },
      change: { netSales: 100, netProfit: -62.5 },
    });
  });

  it("ítems sin costo: excluidos, contados y con aviso", async () => {
    await sale("2026-10-10T12:00:00-06:00", 100, [{ quantity: 1, unitCost: 40 }, { quantity: 2, unitCost: null }]);
    const { body } = await get(`/api/kpis/profit${OCT}`).expect(200);
    expect(body.current).toMatchObject({
      costOfGoodsSold: 40,
      itemsWithoutCost: 1,
      warnings: ["Hay productos vendidos sin costo registrado"],
    });
  });

  it("rango sin ventas ni gastos → todo en 0 y margen null", async () => {
    const { body } = await get(`/api/kpis/profit${OCT}`).expect(200);
    expect(body.current).toEqual({
      netSales: 0,
      costOfGoodsSold: 0,
      grossProfit: 0,
      expenses: 0,
      netProfit: 0,
      marginPct: null,
      itemsWithoutCost: 0,
      warnings: [],
    });
  });

  it("requiere sesión", async () => {
    await request(app).get(`/api/kpis/profit${OCT}`).expect(401);
  });

  it.each([
    ["?from=2026-10-1&to=2026-10-31", "from", "La fecha debe tener formato AAAA-MM-DD"],
    ["?from=2026-10-01", "to", "Indica fecha inicial y final"],
    ["?from=2026-10-31&to=2026-10-01", "from", "La fecha inicial no puede ser posterior a la final"],
    ["?from=2025-01-01&to=2026-01-02", "to", "El rango máximo es de 366 días"],
  ])("400 con %s", async (query, path, message) => {
    const res = await get(`/api/kpis/profit${query}`).expect(400);
    expect(res.body.errors).toEqual([expect.objectContaining({ path: [path], message })]);
  });
});
