import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";
import { startMongo } from "./mongo";
import { migrate } from "../../prisma/migrate-initial-stock-movements.mjs";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;
let prisma: any;
let auth: string;
let userId: string;
const missingId = "507f1f77bcf86cd799439099";

beforeAll(async () => {
  db = await startMongo();
  ({ app, prisma } = db);
}, 300_000);

afterAll(() => db?.stop());

beforeEach(async () => {
  await db.reset();
  const user = await prisma.user.create({ data: { name: "Ana", lastname: "Pérez", email: "a@a.mx", password: "x" } });
  userId = user.id;
  auth = `Bearer ${signToken({ userId })}`;
});

const api = () => ({
  post: (url: string, body: object) => request(app).post(url).set("Authorization", auth).send(body),
  put: (url: string, body: object) => request(app).put(url).set("Authorization", auth).send(body),
  get: (url: string) => request(app).get(url).set("Authorization", auth),
});
const createA1 = async (stock = 10) =>
  (await api().post("/api/products", { name: "Arroz", productCode: "A1", price: 10, cost: 6, stock }).expect(201)).body.id;
const move = (id: string, body: object) => api().post(`/api/products/${id}/movements`, body);
const stockOf = async (id: string) => (await prisma.product.findUnique({ where: { id } })).stock;
const movementsOf = (productId: string) =>
  prisma.stockMovement.findMany({ where: { productId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
const sumOf = (ms: { quantity: number }[]) => ms.reduce((s, m) => s + m.quantity, 0);

describe("movimientos de stock", () => {
  it("PUT con stock → 400; ajuste -7 con motivo → stock 3 y movimiento con usuario y motivo", async () => {
    const id = await createA1();
    const put = await api().put(`/api/products/${id}`, { stock: 3 }).expect(400);
    expect(put.body.issues).toContainEqual(
      expect.objectContaining({ path: "stock", message: "El stock se modifica con movimientos" })
    );
    expect(await stockOf(id)).toBe(10);

    expect((await move(id, { type: "ADJUSTMENT", quantity: -7, reason: "Conteo físico" }).expect(201)).body.stock).toBe(3);
    const { body } = await api().get(`/api/products/${id}/movements`).expect(200);
    expect(body.total).toBe(2);
    expect(body.data[0]).toMatchObject({
      type: "ADJUSTMENT", quantity: -7, stockAfter: 3, reason: "Conteo físico", userId, userName: "Ana Pérez",
    });
    expect(body.data[1]).toMatchObject({ type: "ADJUSTMENT", quantity: 10, stockAfter: 10, reason: "Stock inicial" });
  });

  it("venta de 2 → SALE -2 con saleId; entrada → PURCHASE; suma de movimientos = stock", async () => {
    const id = await createA1();
    const sale = await api()
      .post("/api/sales", { items: [{ productCode: "A1", quantity: 2 }], paymentMethod: "CASH" })
      .expect(201);
    await api().post(`/api/products/${id}/stock`, { quantity: 5, reason: "Compra" }).expect(200);
    await move(id, { type: "WASTE", quantity: -1, reason: "Roto" }).expect(201);

    const ms = await movementsOf(id);
    expect(ms.map((m: any) => [m.type, m.quantity, m.stockAfter])).toEqual([
      ["ADJUSTMENT", 10, 10], ["SALE", -2, 8], ["PURCHASE", 5, 13], ["WASTE", -1, 12],
    ]);
    expect(ms[1]).toMatchObject({ saleId: sale.body.id, userId });
    expect(ms[2]).toMatchObject({ reason: "Compra", userId });
    expect(sumOf(ms)).toBe(await stockOf(id));
  });

  it.each([
    [{ type: "PURCHASE", quantity: 1, reason: "x" }, 400, "type", 'Opción inválida: se esperaba una de "WASTE"|"ADJUSTMENT"'],
    [{ type: "ADJUSTMENT", quantity: 0, reason: "x" }, 400, "quantity", "La cantidad debe ser un entero distinto de 0"],
    [{ type: "ADJUSTMENT", quantity: 1.5, reason: "x" }, 400, "quantity", "La cantidad debe ser un entero distinto de 0"],
    [{ type: "WASTE", quantity: 2, reason: "x" }, 400, "quantity", "Una merma debe ser negativa"],
    [{ type: "ADJUSTMENT", quantity: 1, reason: "" }, 400, "reason", "El motivo es obligatorio"],
    [{ type: "ADJUSTMENT", quantity: -11, reason: "x" }, 409, null, "Stock insuficiente: disponible 10"],
  ])("%j → %i sin cambiar stock", async (body, status, path, message) => {
    const id = await createA1();
    const res = await move(id, body).expect(status);
    if (path) expect(res.body.issues).toContainEqual(expect.objectContaining({ path, message }));
    else expect(res.body.message).toBe(message);
    expect(await stockOf(id)).toBe(10);
    expect(await movementsOf(id)).toHaveLength(1);
  });

  it("producto inexistente → 404 en alta y consulta de movimientos", async () => {
    const body = { type: "ADJUSTMENT", quantity: 1, reason: "x" };
    expect((await move(missingId, body).expect(404)).body.message).toBe("Producto no encontrado");
    expect((await api().get(`/api/products/${missingId}/movements`).expect(404)).body.message).toBe("Producto no encontrado");
    expect(await prisma.stockMovement.count()).toBe(0);
  });

  it("10 entradas concurrentes de +1 → stock +10 y 10 movimientos con stockAfter distintos", async () => {
    const id = await createA1();
    await Promise.all(Array.from({ length: 10 }, () => api().post(`/api/products/${id}/stock`, { quantity: 1 }).expect(200)));
    expect(await stockOf(id)).toBe(20);
    const purchases = (await movementsOf(id)).filter((m: any) => m.type === "PURCHASE");
    expect(purchases.map((m: any) => m.stockAfter).sort((a: number, b: number) => a - b)).toEqual(
      Array.from({ length: 10 }, (_, i) => 11 + i)
    );
  });

  it("lista paginada, más reciente primero", async () => {
    const id = await createA1();
    for (const q of [1, 2, 3]) await move(id, { type: "ADJUSTMENT", quantity: q, reason: `r${q}` }).expect(201);
    const { body } = await api().get(`/api/products/${id}/movements?page=2&pageSize=2`).expect(200);
    expect(body).toMatchObject({ total: 4, page: 2, pageSize: 2 });
    expect(body.data.map((m: any) => m.reason)).toEqual(["r1", "Stock inicial"]);
  });

  it("migración de stock inicial: un ADJUSTMENT por producto previo, idempotente", async () => {
    const legacy = await prisma.product.create({ data: { name: "Frijol", productCode: "F1", price: 5, stock: 4 } });
    await prisma.product.create({ data: { name: "Vacío", productCode: "V1", price: 5, stock: 0 } });
    await createA1();
    expect(await migrate(prisma)).toBe(1);
    expect(await migrate(prisma)).toBe(0);
    expect(await movementsOf(legacy.id)).toMatchObject([
      { type: "ADJUSTMENT", quantity: 4, stockAfter: 4, reason: "Stock inicial", userId: null },
    ]);
  });
});
