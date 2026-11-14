import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";
import { startMongo } from "./mongo";

// Proceso en UTC (vitest.config) y negocio en America/Mexico_City (UTC−6).
let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;
// Token firmado con el reloj simulado: uno de hoy vencería en fechas futuras.
const auth = () => `Bearer ${signToken({ userId: "507f1f77bcf86cd799439011" })}`;
const get = (url: string) => request(app).get(url).set("Authorization", auth()).expect(200);
const sale = (createdAt: string, total: number) =>
  db.prisma.sale.create({
    data: { ticketNumber: createdAt, subtotal: total, tax: 0, total, paymentMethod: "CASH", createdAt: new Date(createdAt) },
  });

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());
beforeEach(() => db.reset());
afterEach(() => vi.useRealTimers());

const at = (iso: string) => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(iso));
};

describe("KPIs en hora del negocio", () => {
  it("venta de las 20:00 cuenta en todayRevenue del mismo día", async () => {
    await sale("2026-11-13T20:00:00-06:00", 116);
    at("2026-11-13T20:05:00-06:00");
    const res = await get("/api/kpis/summary");
    expect(res.body).toMatchObject({ todayRevenue: 116, todaySalesCount: 1, month: 11 });
  });

  it("venta y gasto del 30-nov 23:00 cuentan en noviembre", async () => {
    await sale("2026-11-30T23:00:00-06:00", 50);
    await db.prisma.expense.create({
      data: { concept: "Luz", category: "service", amount: 30, date: new Date("2026-11-30T23:00:00-06:00") },
    });
    at("2026-11-30T23:30:00-06:00");

    const header = await get("/api/kpis/header");
    expect(header.body).toMatchObject({ month: 11, year: 2026, totalSalesAmount: 50 });

    const expenses = await get("/api/expenses/kpis");
    expect(expenses.body).toMatchObject({ month: 11, totalAmountMonth: 30 });
  });
});
