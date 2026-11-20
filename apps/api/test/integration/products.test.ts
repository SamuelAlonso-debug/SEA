import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { bearer } from "./session";
import { startMongo } from "./mongo";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;
const auth = bearer("ADMIN");
const missingId = "507f1f77bcf86cd799439099";

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());
beforeEach(() => db.reset());

const a1 = { name: "Arroz", productCode: "A1", price: 10, cost: 6, stock: 5 };
const create = (body: object) => request(app).post("/api/products").set("Authorization", auth).send(body);
const entry = (id: string, body: object) =>
  request(app).post(`/api/products/${id}/stock`).set("Authorization", auth).send(body);
const find = (productCode: string) => db.prisma.product.findUnique({ where: { productCode } });

describe("productos: código duplicado y entrada de stock", () => {
  it("alta duplicada → 409 sin tocar stock ni precio", async () => {
    await create(a1).expect(201);
    const res = await create({ ...a1, price: 20 }).expect(409);
    expect(res.body.message).toBe("Ya existe un producto con el código A1");
    expect(await find("A1")).toMatchObject({ stock: 5, price: 10 });
  });

  it("altas simultáneas con el mismo código → un 201 y un 409", async () => {
    const res = await Promise.all([create(a1), create(a1)]);
    expect(res.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await db.prisma.product.count()).toBe(1);
  });

  it("reactivar: id inválido → 400; producto dado de baja → 200 activo", async () => {
    const p = await create(a1).expect(201);
    await request(app).delete(`/api/products/${p.body.id}`).set("Authorization", auth).expect(200);
    const bad = await request(app).patch("/api/products/abc/activate").set("Authorization", auth).expect(400);
    expect(bad.body.issues).toContainEqual(expect.objectContaining({ path: "id", message: "ID inválido" }));
    const ok = await request(app).patch(`/api/products/${p.body.id}/activate`).set("Authorization", auth);
    expect(ok.body).toMatchObject({ isActive: true });
    expect(ok.status).toBe(200);
  });

  it("edición con el código de otro producto → 409", async () => {
    await create(a1).expect(201);
    const b = await create({ ...a1, productCode: "B1" }).expect(201);
    const res = await request(app).put(`/api/products/${b.body.id}`).set("Authorization", auth).send({ productCode: "A1" });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Ya existe un producto con el código A1");
  });

  it("entrada de 3 → stock 8", async () => {
    const p = await create(a1).expect(201);
    expect((await entry(p.body.id, { quantity: 3, reason: "Compra" }).expect(200)).body.stock).toBe(8);
  });

  it("10 entradas concurrentes de 1 → +10", async () => {
    const p = await create(a1).expect(201);
    await Promise.all(Array.from({ length: 10 }, () => entry(p.body.id, { quantity: 1 }).expect(200)));
    expect((await find("A1"))!.stock).toBe(15);
  });

  it.each([
    [{ quantity: 0 }, "quantity", "La cantidad debe ser un entero mayor a 0"],
    [{ quantity: -2 }, "quantity", "La cantidad debe ser un entero mayor a 0"],
    [{ quantity: 1.5 }, "quantity", "La cantidad debe ser un entero mayor a 0"],
    [{ quantity: 1, reason: "x".repeat(256) }, "reason", "El motivo no puede tener más de 255 caracteres"],
  ])("400 con %j", async (body, path, message) => {
    const p = await create(a1).expect(201);
    const res = await entry(p.body.id, body).expect(400);
    expect(res.body.issues).toContainEqual(expect.objectContaining({ path, message }));
  });

  it("entrada a producto inexistente → 404", async () => {
    expect((await entry(missingId, { quantity: 1 }).expect(404)).body.message).toBe("Producto no encontrado");
  });
});
