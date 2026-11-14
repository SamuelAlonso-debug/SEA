import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";
import { startMongo } from "./mongo";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;
let auth: string;
const missingId = "507f1f77bcf86cd799439099";

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());

beforeEach(async () => {
  await db.reset();
  const user = await db.prisma.user.create({ data: { name: "C", lastname: "C", email: "c@c.mx", password: "x" } });
  auth = `Bearer ${signToken({ userId: user.id })}`;
  await db.prisma.product.create({ data: { name: "A", productCode: "A", price: 10, stock: 5 } });
});

const sell = (extra: object) =>
  request(app)
    .post("/api/sales")
    .set("Authorization", auth)
    .send({ items: [{ productCode: "A", quantity: 1 }], paymentMethod: "CASH", ...extra });
const clientSales = (id: string) => request(app).get(`/api/clients/${id}/sales`).set("Authorization", auth);

describe("venta con cliente", () => {
  it("guarda el cliente y aparece en su historial", async () => {
    const client = await db.prisma.client.create({ data: { name: "Ana", lastname: "Pérez", phone: "4421234567" } });
    const sale = await sell({ clientId: client.id }).expect(201);
    expect(sale.body).toMatchObject({ clientId: client.id, clientName: "Ana Pérez" });

    const history = await clientSales(client.id).expect(200);
    expect(history.body.map((s: any) => s.id)).toEqual([sale.body.id]);
  });

  it("cliente inexistente → 404 sin venta ni stock descontado", async () => {
    const res = await sell({ clientId: missingId }).expect(404);
    expect(res.body.message).toBe("Cliente no encontrado");
    expect(await db.prisma.sale.count()).toBe(0);
    expect((await db.prisma.product.findUnique({ where: { productCode: "A" } }))!.stock).toBe(5);
  });

  it("venta sin cliente → 201", async () => {
    const res = await sell({}).expect(201);
    expect(res.body.clientId).toBeNull();
  });

  it("clientId que no es ObjectId → 400", async () => {
    const res = await sell({ clientId: "abc" }).expect(400);
    expect(res.body.errors).toContainEqual(expect.objectContaining({ path: ["clientId"], message: "ID inválido" }));
  });

  it("historial de cliente inexistente → 404", async () => {
    expect((await clientSales(missingId).expect(404)).body.message).toBe("Cliente no encontrado");
  });
});
