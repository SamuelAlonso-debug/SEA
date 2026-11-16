import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";
import { startMongo } from "./mongo";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;
const auth = `Bearer ${signToken({ userId: "507f1f77bcf86cd799439011" })}`;
const get = (url: string) => request(app).get(url).set("Authorization", auth);

// Texto del CSV sin BOM, en líneas.
const lines = (text: string) => text.replace(/^\uFEFF/, "").trimEnd().split("\r\n");

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());
beforeEach(() => db.reset());

const OCT = "?from=2026-10-01&to=2026-10-31";
// Hoy en hora del negocio, calculado sin el código bajo prueba.
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: process.env.BUSINESS_TIMEZONE }).format(new Date());

describe("GET /api/sales/export", () => {
  beforeEach(async () => {
    const client = await db.prisma.client.create({ data: { name: "José", lastname: "Pérez, Jr.", phone: "1" } });
    const a = await db.prisma.product.create({ data: { name: "=CMD()", productCode: "A", price: 10, stock: 0 } });
    const b = await db.prisma.product.create({ data: { name: 'Café "molido"', productCode: "B", price: 3.33, stock: 0 } });
    // Ticket con tres ítems: el IVA (16 %) no se reparte exacto y debe sumar el total de la venta.
    const sale = await db.prisma.sale.create({
      data: { ticketNumber: "0000001", subtotal: 16.65, tax: 2.66, total: 19.31, paymentMethod: "CARD", clientId: client.id, createdAt: new Date("2026-10-15T12:00:00-06:00") },
    });
    await db.prisma.saleItem.createMany({
      data: [
        { saleId: sale.id, productId: a.id, quantity: 1, unitPrice: 10, subtotal: 10 },
        { saleId: sale.id, productId: b.id, quantity: 1, unitPrice: 3.33, subtotal: 3.33 },
        { saleId: sale.id, productId: b.id, quantity: 1, unitPrice: 3.32, subtotal: 3.32 },
      ],
    });
    // Fuera de octubre (hora local): no debe salir.
    const old = await db.prisma.sale.create({
      data: { ticketNumber: "0000002", subtotal: 10, tax: 1.6, total: 11.6, paymentMethod: "CASH", createdAt: new Date("2026-09-30T23:00:00-06:00") },
    });
    await db.prisma.saleItem.create({ data: { saleId: old.id, productId: a.id, quantity: 1, unitPrice: 10, subtotal: 10 } });
  });

  it("descarga UTF-8 con BOM y nombre con el rango", async () => {
    const res = await get(`/api/sales/export${OCT}`).expect(200);
    expect(res.headers["content-type"]).toBe("text/csv; charset=utf-8");
    expect(res.headers["content-disposition"]).toBe('attachment; filename="ventas_2026-10-01_2026-10-31.csv"');
    expect(res.text.startsWith("﻿")).toBe(true);
    expect(res.text).toContain('José Pérez, Jr.');
  });

  it("una fila por ítem y la suma de Total por ticket es el total de la venta", async () => {
    const rows = lines((await get(`/api/sales/export${OCT}`)).text);
    expect(rows[0]).toBe("Ticket,Fecha,Código,Producto,Cantidad,Precio,Subtotal,IVA,Total,Método de pago,Cliente,Cajero");
    expect(rows).toHaveLength(4);
    expect(rows[1]).toContain("0000001,2026-10-15 12:00,A,");
    const totals = rows.slice(1).map((r) => Math.round(Number(r.match(/,(\d+\.\d\d),CARD,/)![1]) * 100));
    expect(totals.reduce((a, b) => a + b, 0)).toBe(1931);
  });

  it("escapa fórmulas y comillas", async () => {
    const text = (await get(`/api/sales/export${OCT}`)).text;
    expect(text).toContain("'=CMD()");
    expect(text).toContain('"Café ""molido"""');
  });

  it("rango sin datos: solo encabezados", async () => {
    const res = await get("/api/sales/export?from=2025-01-01&to=2025-01-31").expect(200);
    expect(lines(res.text)).toHaveLength(1);
  });

  it("sin rango usa el mes en curso en el nombre", async () => {
    const res = await get("/api/sales/export").expect(200);
    expect(res.headers["content-disposition"]).toMatch(/filename="ventas_\d{4}-\d{2}-01_\d{4}-\d{2}-\d{2}\.csv"/);
  });

  it("?period=TODAY: nombre con el día en curso y solo ventas de hoy", async () => {
    const a = await db.prisma.product.findFirstOrThrow({ where: { productCode: "A" } });
    const sale = await db.prisma.sale.create({ data: { ticketNumber: "0000003", subtotal: 10, tax: 1.6, total: 11.6, paymentMethod: "CASH" } });
    await db.prisma.saleItem.create({ data: { saleId: sale.id, productId: a.id, quantity: 1, unitPrice: 10, subtotal: 10 } });
    const day = today();
    const res = await get("/api/sales/export?period=TODAY").expect(200);
    if (today() !== day) return; // cruzó la medianoche durante la petición
    expect(res.headers["content-disposition"]).toBe(`attachment; filename="ventas_${day}_${day}.csv"`);
    expect(lines(res.text).slice(1).map((l) => l.split(",")[0])).toEqual(["0000003"]);
  });

  it("errores de rango con los mensajes de #86", async () => {
    const bad = await get("/api/sales/export?from=2026-1-01&to=2026-10-31").expect(400);
    expect(bad.body.errors).toMatchObject([{ path: ["from"], message: "La fecha debe tener formato AAAA-MM-DD" }]);
    const half = await get("/api/sales/export?from=2026-10-01").expect(400);
    expect(half.body.errors).toMatchObject([{ path: ["to"], message: "Indica fecha inicial y final" }]);
    const order = await get("/api/sales/export?from=2026-10-31&to=2026-10-01").expect(400);
    expect(order.body.errors[0].message).toBe("La fecha inicial no puede ser posterior a la final");
    const long = await get("/api/sales/export?from=2025-01-01&to=2026-12-31").expect(400);
    expect(long.body.errors[0].message).toBe("El rango máximo es de 366 días");
  });

  it("exige sesión", async () => {
    await request(app).get(`/api/sales/export${OCT}`).expect(401);
  });
});

describe("GET /api/expenses/export", () => {
  beforeEach(async () => {
    const e = (concept: string, category: any, date: string) =>
      db.prisma.expense.create({ data: { concept, category, amount: 100.5, paymentMethod: "CASH", date: new Date(date), vendor: "Luz, S.A.", notes: null } });
    await e("Luz", "service", "2026-10-02T10:00:00-06:00");
    await e("Renta", "rent", "2026-10-03T10:00:00-06:00");
    await e("Viejo", "rent", "2026-08-03T10:00:00-06:00");
  });

  it("filtra por rango y categoría", async () => {
    const all = await get(`/api/expenses/export${OCT}`).expect(200);
    expect(all.headers["content-disposition"]).toBe('attachment; filename="gastos_2026-10-01_2026-10-31.csv"');
    expect(lines(all.text)).toHaveLength(3);
    const rent = lines((await get(`/api/expenses/export${OCT}&category=rent`)).text);
    expect(rent).toEqual(["Fecha,Concepto,Categoría,Monto,Método de pago,Proveedor,Notas", '2026-10-03 10:00,Renta,rent,100.50,CASH,"Luz, S.A.",']);
  });

  it("?period=TODAY: nombre con el día en curso", async () => {
    const day = today();
    const res = await get("/api/expenses/export?period=TODAY").expect(200);
    if (today() !== day) return;
    expect(res.headers["content-disposition"]).toBe(`attachment; filename="gastos_${day}_${day}.csv"`);
  });

  it("categoría fuera del catálogo: 400 con path y mensaje", async () => {
    const res = await get(`/api/expenses/export${OCT}&category=x`).expect(400);
    expect(res.body.errors).toMatchObject([
      { path: ["category"], message: 'Opción inválida: se esperaba una de "service"|"merchandise"|"maintenance"|"rent"|"payroll"|"tax"|"other"' },
    ]);
  });

  it("errores de rango con los mensajes de #86", async () => {
    const res = await get("/api/expenses/export?from=2026-10-31&to=2026-10-01").expect(400);
    expect(res.body.errors[0].message).toBe("La fecha inicial no puede ser posterior a la final");
  });
});

describe("GET /api/products/export", () => {
  it("catálogo con stock, costo y mínimo (null = 5), también inactivos", async () => {
    await db.prisma.product.create({ data: { name: "Tuerca", productCode: "T1", category: "Ferretería", price: 5, cost: 2.5, stock: 7, minStock: 3, provider: "ACME" } });
    await db.prisma.product.create({ data: { name: "Clavo", productCode: "C1", price: 1, stock: 0, isActive: false, minStock: null } });
    const res = await get("/api/products/export").expect(200);
    expect(res.headers["content-disposition"]).toBe('attachment; filename="inventario.csv"');
    const rows = lines(res.text);
    expect(rows[0]).toBe("Código,Producto,Categoría,Proveedor,Precio,Costo,Stock,Stock mínimo,Activo");
    expect(rows).toContain("T1,Tuerca,Ferretería,ACME,5.00,2.50,7,3,Sí");
    expect(rows).toContain("C1,Clavo,,,1.00,,0,5,No");
  });
});

describe("memoria", () => {
  it("50 000 ítems se exportan sin superar 100 MB adicionales", async () => {
    const p = await db.prisma.product.create({ data: { name: "P", productCode: "P", price: 1, stock: 0 } });
    const sales = Array.from({ length: 10_000 }, (_, i) => ({
      ticketNumber: String(i + 1).padStart(7, "0"),
      subtotal: 5,
      tax: 0.8,
      total: 5.8,
      paymentMethod: "CASH" as const,
      createdAt: new Date("2026-10-15T12:00:00-06:00"),
    }));
    await db.prisma.sale.createMany({ data: sales });
    const ids = (await db.prisma.sale.findMany({ select: { id: true } })).map((s) => s.id);
    await db.prisma.saleItem.createMany({
      data: ids.flatMap((saleId) => Array.from({ length: 5 }, () => ({ saleId, productId: p.id, quantity: 1, unitPrice: 1, subtotal: 1 }))),
    });

    const base = process.memoryUsage().rss;
    let peak = base;
    const timer = setInterval(() => (peak = Math.max(peak, process.memoryUsage().rss)), 5);
    let rows = 0;
    await get(`/api/sales/export${OCT}`)
      .buffer(false)
      .parse((res, cb) => {
        res.on("data", (chunk: Buffer) => (rows += chunk.toString().split("\r\n").length - 1));
        res.on("end", () => cb(null, null));
      });
    clearInterval(timer);
    expect(rows).toBe(50_001); // 50 000 ítems + encabezado
    expect(peak - base).toBeLessThan(100 * 1024 * 1024);
  }, 120_000);
});
