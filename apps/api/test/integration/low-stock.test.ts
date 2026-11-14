import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";
import { startMongo } from "./mongo";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;
const auth = `Bearer ${signToken({ userId: "507f1f77bcf86cd799439011" })}`;

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());
beforeEach(() => db.reset());

const create = (body: object) =>
  request(app).post("/api/products").set("Authorization", auth).send({ name: "Prod", price: 10, cost: 6, ...body });
const lowStock = async () =>
  (await request(app).get("/api/kpis/low-stock").set("Authorization", auth).expect(200)).body;

describe("stock mínimo por producto", () => {
  it("alto rotación con minStock 60 aparece; baja rotación con minStock 2 no", async () => {
    const res = await create({ productCode: "ALTA", stock: 10, minStock: 60 }).expect(201);
    expect(res.body.minStock).toBe(60);
    await create({ productCode: "BAJA", stock: 4, minStock: 2 }).expect(201);
    expect((await lowStock()).map((p: any) => p.productCode)).toEqual(["ALTA"]);
  });

  it("producto sin minStock (previo) usa umbral 5", async () => {
    // Documento previo a la migración: sin el campo.
    await db.prisma.$runCommandRaw({
      insert: "Product",
      documents: [{ name: "Viejo", productCode: "OLD", price: 1, stock: 5, isActive: true, createdAt: { $date: new Date().toISOString() }, updatedAt: { $date: new Date().toISOString() } }],
    });
    await create({ productCode: "SIN", stock: 6 }).expect(201); // sin minStock → @default 5
    expect(await lowStock()).toEqual([expect.objectContaining({ productCode: "OLD", minStock: 5, missing: 0 })]);
  });

  it("incluye minStock y missing, ordenado por faltante", async () => {
    await create({ productCode: "AA", stock: 8, minStock: 10 }).expect(201);
    await create({ productCode: "BB", stock: 0, minStock: 20 }).expect(201);
    expect((await lowStock()).map((p: any) => [p.productCode, p.minStock, p.missing])).toEqual([
      ["BB", 20, 20],
      ["AA", 10, 2],
    ]);
  });

  it.each([
    [-1, "El stock mínimo no puede ser negativo"],
    [1.5, "El stock mínimo debe ser un número entero"],
    [1_000_001, "El stock mínimo es demasiado alto"],
  ])("minStock %d → 400", async (minStock, message) => {
    const res = await create({ productCode: "X", stock: 1, minStock }).expect(400);
    expect(res.body.errors).toContainEqual(expect.objectContaining({ path: ["minStock"], message }));
  });
});
