import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";
import { startMongo } from "./mongo";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;
const auth = `Bearer ${signToken({ userId: "507f1f77bcf86cd799439011" })}`;
const get = (url: string) => request(app).get(url).set("Authorization", auth);

let n = 0;
const sale = (createdAt: string, total: number, paymentMethod = "CASH") =>
  db.prisma.sale.create({
    data: { ticketNumber: String(++n), subtotal: total, tax: 0, total, paymentMethod: paymentMethod as any, createdAt: new Date(createdAt) },
  });

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());
beforeEach(() => db.reset());

const OCT = "?from=2026-10-01&to=2026-10-31";

describe("KPIs por rango con periodo anterior", () => {
  beforeEach(async () => {
    const oct = await sale("2026-10-15T12:00:00-06:00", 1000);
    const sep = await sale("2026-09-30T23:00:00-06:00", 800, "CARD"); // último día de septiembre, hora local
    const p = await db.prisma.product.create({ data: { name: "P", productCode: "P", price: 10, stock: 0 } });
    const item = (saleId: string, quantity: number) => ({ saleId, productId: p.id, quantity, unitPrice: 10, subtotal: 10 * quantity });
    await db.prisma.saleItem.createMany({ data: [item(oct.id, 2), item(sep.id, 1)] });
    await db.prisma.expense.create({
      data: { concept: "Luz", category: "service", amount: 200, paymentMethod: "CASH", date: new Date("2026-10-02T10:00:00-06:00") },
    });
  });

  it("header: octubre vs septiembre", async () => {
    const res = await get(`/api/kpis/header${OCT}`).expect(200);
    expect(res.body).toMatchObject({
      period: { from: "2026-10-01", to: "2026-10-31" },
      previousPeriod: { from: "2026-09-01", to: "2026-09-30" },
      current: { totalSalesAmount: 1000, month: 10 },
      previous: { totalSalesAmount: 800, month: 9 },
      change: { totalSalesAmount: 25, totalTransactions: 0 },
    });
  });

  it("payment-methods, top-products, summary y gastos usan el rango", async () => {
    const pm = await get(`/api/kpis/payment-methods${OCT}`).expect(200);
    expect(pm.body.current).toEqual([{ paymentMethod: "CASH", totalSalesAmount: 1000, count: 1 }]);
    expect(pm.body.change).toEqual({ CASH: null });

    const top = await get(`/api/kpis/top-products${OCT}`).expect(200);
    expect(top.body.current).toMatchObject([{ totalQuantity: 2 }]);
    expect(top.body.previous).toMatchObject([{ totalQuantity: 1 }]);
    expect(top.body).not.toHaveProperty("change");
    expect((await get(`/api/kpis/summary${OCT}`).expect(200)).body.current).toMatchObject({ averageTicketAmount: 1000 });

    const exp = await get(`/api/expenses/kpis${OCT}`).expect(200);
    expect(exp.body).toMatchObject({ current: { totalAmountMonth: 200 }, previous: { totalAmountMonth: 0 }, change: { totalAmountMonth: null } });
  });

  it("sin query → mes en curso", async () => {
    const res = await get("/api/kpis/header").expect(200);
    expect(res.body.period.from).toMatch(/^\d{4}-\d{2}-01$/);
    expect(res.body.current).toHaveProperty("totalSalesAmount");
  });

  it.each([
    ["?from=2026-10-1&to=2026-10-31", "from", "La fecha debe tener formato AAAA-MM-DD"],
    ["?from=2026-02-30&to=2026-03-01", "from", "La fecha debe tener formato AAAA-MM-DD"],
    ["?from=2026-10-01", "to", "Indica fecha inicial y final"],
    ["?to=2026-10-01", "from", "Indica fecha inicial y final"],
    ["?from=2026-10-31&to=2026-10-01", "from", "La fecha inicial no puede ser posterior a la final"],
    ["?from=2025-01-01&to=2026-01-02", "to", "El rango máximo es de 366 días"],
  ])("400 con %s", async (query, path, message) => {
    for (const url of ["/api/kpis/header", "/api/expenses/kpis"]) {
      const res = await get(`${url}${query}`).expect(400);
      expect(res.body.errors).toEqual([expect.objectContaining({ path: [path], message })]);
    }
  });
});

describe("KPIs: parámetros desconocidos", () => {
  it.each(["header", "payment-methods", "top-products", "summary", "low-stock"])("%s rechaza ?foo=1 con 400", async (endpoint) => {
    const res = await get(`/api/kpis/${endpoint}?foo=1`).expect(400);
    expect(res.body.errors).toMatchObject([{ path: ["foo"] }]);
  });

  it("header ya no acepta month/year sueltos", async () => {
    const res = await get("/api/kpis/header?month=3&year=2026").expect(400);
    expect(res.body.errors.map((e: any) => e.path[0]).sort()).toEqual(["month", "year"]);
  });

  it("body inesperado → 400", async () => {
    await request(app).get("/api/kpis/header").set("Authorization", auth).send({ a: 1 }).expect(400);
  });
});

describe("presets ?period=", () => {
  // Hoy en hora del negocio, calculado sin el código bajo prueba.
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: process.env.BUSINESS_TIMEZONE }).format(d);

  it("TODAY: periodo de un día y anterior = ayer", async () => {
    const now = new Date();
    const res = await get("/api/kpis/header?period=TODAY").expect(200);
    const today = day(now);
    if (day(new Date()) !== today) return; // cruzó la medianoche durante la petición
    expect(res.body.period).toEqual({ from: today, to: today });
    const yesterday = day(new Date(now.getTime() - 86_400_000));
    expect(res.body.previousPeriod).toEqual({ from: yesterday, to: yesterday });
  });

  it("MONTH: misma respuesta que sin query", async () => {
    await sale(new Date().toISOString(), 500);
    const [a, b] = await Promise.all([get("/api/kpis/header?period=MONTH"), get("/api/kpis/header")]);
    expect(a.status).toBe(200);
    expect(a.body).toEqual(b.body);
    const [c, d] = await Promise.all([get("/api/expenses/kpis?period=MONTH"), get("/api/expenses/kpis")]);
    expect(c.status).toBe(200);
    expect(c.body).toEqual(d.body);
  });

  it("TODAY aplica en gastos", async () => {
    const res = await get("/api/expenses/kpis?period=TODAY").expect(200);
    expect(res.body.period.from).toBe(res.body.period.to);
  });

  it.each([
    ["?period=WEEK", 'Opción inválida: se esperaba una de "TODAY" o "MONTH"'],
    ["?period=TODAY&from=2026-10-01&to=2026-10-31", "Indica periodo o rango, no ambos"],
  ])("400 con %s", async (query, message) => {
    for (const url of ["/api/kpis/header", "/api/expenses/kpis"]) {
      const res = await get(`${url}${query}`).expect(400);
      expect(res.body.errors).toEqual([expect.objectContaining({ path: ["period"], message })]);
    }
  });
});
