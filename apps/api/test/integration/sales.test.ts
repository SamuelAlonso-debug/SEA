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
  const user = await db.prisma.user.create({ data: { name: "C", lastname: "C", email: "c@c.mx", password: "x" } });
  auth = `Bearer ${signToken({ userId: user.id })}`;
  await db.prisma.product.createMany({
    data: [
      { name: "A", productCode: "A", price: 100, stock: 5 },
      { name: "B", productCode: "B", price: 33.33, stock: 5 },
    ],
  });
});

const sell = (body: object) => request(db.app).post("/api/sales").set("Authorization", auth).send(body);

describe("POST /api/sales", () => {
  it("guarda subtotal, IVA y total; los KPIs suman el total", async () => {
    const res = await sell({ items: [{ productCode: "A", quantity: 1 }], paymentMethod: "CASH" }).expect(201);
    expect(res.body).toMatchObject({ subtotal: 100, tax: 16, total: 116 });
    expect(await db.prisma.sale.findFirst()).toMatchObject({ subtotal: 100, tax: 16, total: 116 });

    const kpis = await request(db.app).get("/api/kpis/header").set("Authorization", auth).expect(200);
    expect(kpis.body.current.totalSalesAmount).toBe(116);
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
