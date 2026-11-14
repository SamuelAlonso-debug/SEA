import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { signToken } from "../../src/shared/jwt";

// Base en memoria: Mongo con transacciones exige replica set, fuera del alcance de CI.
const db = vi.hoisted(() => ({ products: [] as any[], sales: [] as any[] }));

vi.mock("../../src/shared/prisma", () => {
  const client: any = {
    product: {
      findUnique: async ({ where }: any) => db.products.find((p) => p.productCode === where.productCode) ?? null,
      update: async ({ where, data }: any) => Object.assign(db.products.find((p) => p.id === where.id), data),
    },
    sale: {
      count: async () => db.sales.length,
      findMany: async () => db.sales,
      create: async ({ data }: any) => {
        const sale = {
          ...data,
          id: `s${db.sales.length + 1}`,
          createdAt: new Date(),
          items: data.items.create.map((i: any, n: number) => {
            const product = db.products.find((p) => p.id === i.product.connect.id);
            return { ...i, id: `i${n}`, productId: product.id, product };
          }),
        };
        db.sales.push(sale);
        return sale;
      },
    },
  };
  client.$transaction = (fn: any) => fn(client);
  return { default: client };
});

const auth = `Bearer ${signToken({ userId: "507f1f77bcf86cd799439011" })}`;
const sell = (body: object) => request(app).post("/api/sales").set("Authorization", auth).send(body);

describe("POST /api/sales", () => {
  beforeEach(() => {
    db.sales = [];
    db.products = [
      { id: "p1", productCode: "A", name: "A", price: 100, stock: 5, isActive: true },
      { id: "p2", productCode: "B", name: "B", price: 33.33, stock: 5, isActive: true },
    ];
  });

  it("guarda subtotal, IVA y total; los KPIs suman el total", async () => {
    const res = await sell({ items: [{ productCode: "A", quantity: 1 }], paymentMethod: "CASH" }).expect(201);
    expect(res.body).toMatchObject({ subtotal: 100, tax: 16, total: 116 });
    expect(db.sales[0]).toMatchObject({ subtotal: 100, tax: 16, total: 116 });

    const kpis = await request(app).get("/api/kpis/header").set("Authorization", auth).expect(200);
    expect(kpis.body.totalSalesAmount).toBe(116);
  });

  it("redondea a centavos", async () => {
    const res = await sell({ items: [{ productCode: "B", quantity: 3 }], paymentMethod: "CARD" }).expect(201);
    expect(res.body).toMatchObject({ subtotal: 99.99, tax: 16, total: 115.99 });
  });

  it.each([
    [{ items: [], paymentMethod: "CASH" }, ["items"], "Debe haber al menos un producto en la venta"],
    [{ items: [{ productCode: "A", quantity: 0 }], paymentMethod: "CASH" }, ["items", 0, "quantity"], "La cantidad mínima es 1"],
  ])("400 con %j", async (body, path, message) => {
    const res = await sell(body).expect(400);
    expect(res.body.errors).toContainEqual(expect.objectContaining({ path, message }));
  });
});
