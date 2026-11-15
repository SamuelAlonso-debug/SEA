import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";
import { startMongo } from "./mongo";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;
let auth: string;

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());

beforeEach(async () => {
  await db.reset();
  const user = await db.prisma.user.create({ data: { name: "C", lastname: "C", email: "c@c.mx", password: "x" } });
  auth = `Bearer ${signToken({ userId: user.id })}`;
});

const base = { name: "Café", productCode: "CAFE", price: 100, stock: 10 };
const create = (body: object) => request(app).post("/api/products").set("Authorization", auth).send(body);
const update = (id: string, body: object) =>
  request(app).put(`/api/products/${id}`).set("Authorization", auth).send(body);

describe("costo y margen", () => {
  it("alta con costo → margen; la venta guarda el costo vigente", async () => {
    const p = await create({ ...base, cost: 60 }).expect(201);
    expect(p.body).toMatchObject({ cost: 60, margin: 40, marginPct: 40, warnings: [] });

    await request(app)
      .post("/api/sales")
      .set("Authorization", auth)
      .send({ items: [{ productCode: "CAFE", quantity: 1 }], paymentMethod: "CASH" })
      .expect(201);

    expect((await update(p.body.id, { cost: 70 }).expect(200)).body).toMatchObject({ margin: 30 });
    expect((await db.prisma.saleItem.findFirst())!.unitCost).toBe(60);
  });

  it("precio menor que el costo → aviso sin bloquear", async () => {
    const p = await create({ ...base, cost: 120 }).expect(201);
    expect(p.body.warnings).toEqual(["El precio es menor que el costo"]);
    expect((await update(p.body.id, { price: 130 }).expect(200)).body.warnings).toEqual([]);
  });

  it("producto previo sin costo → cost null y margen null", async () => {
    const now = { $date: new Date().toISOString() };
    await db.prisma.$runCommandRaw({
      insert: "Product",
      documents: [{ name: "Viejo", productCode: "OLD", price: 10, stock: 1, isActive: true, createdAt: now, updatedAt: now }],
    });
    const list = await request(app).get("/api/products").set("Authorization", auth).expect(200);
    expect(list.body[0]).toMatchObject({ productCode: "OLD", margin: null, marginPct: null });
    expect(list.body[0].cost ?? null).toBeNull();
  });

  it.each([
    [base, "El costo es obligatorio"],
    [{ ...base, cost: -1 }, "El costo no puede ser negativo"],
    [{ ...base, cost: "diez" }, "El costo debe ser un número"],
  ])("400 con %j", async (body, message) => {
    const res = await create(body).expect(400);
    expect(res.body.errors).toContainEqual(expect.objectContaining({ path: ["cost"], message }));
  });
});
