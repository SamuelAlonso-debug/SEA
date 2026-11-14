import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";
import { startMongo } from "./mongo";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;
let auth: string;
let clientId: string;

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());

beforeEach(async () => {
  await db.reset();
  const user = await db.prisma.user.create({ data: { name: "C", lastname: "C", email: "c@c.mx", password: "x" } });
  auth = `Bearer ${signToken({ userId: user.id })}`;
  await db.prisma.product.create({ data: { name: "A", productCode: "AA", price: 10, stock: 10 } });
  clientId = (await db.prisma.client.create({ data: { name: "Ana", lastname: "Pérez", phone: "4421234567" } })).id;
});

const api = (method: "get" | "post" | "delete" | "patch", url: string) =>
  request(app)[method](`/api${url}`).set("Authorization", auth);
const sell = () =>
  api("post", "/sales").send({ items: [{ productCode: "AA", quantity: 1 }], paymentMethod: "CASH", clientId });
const listedIds = async (query = "") => (await api("get", `/clients${query}`).expect(200)).body.data.map((c: any) => c.id);

describe("baja lógica de clientes", () => {
  it("baja: sale del listado y conserva sus ventas; reactivar lo devuelve", async () => {
    for (let i = 0; i < 3; i++) await sell().expect(201);

    await api("delete", `/clients/${clientId}`).expect(204);
    expect(await listedIds()).toEqual([]);
    expect(await listedIds("?includeInactive=true")).toEqual([clientId]);
    expect((await api("get", `/clients/${clientId}/sales`).expect(200)).body).toHaveLength(3);

    await api("patch", `/clients/${clientId}/activate`).expect(200);
    expect(await listedIds()).toEqual([clientId]);
  });

  it("cliente previo sin isActive cuenta como activo", async () => {
    await db.prisma.$runCommandRaw({ update: "Client", updates: [{ q: {}, u: { $unset: { isActive: "" } } }] });
    expect(await listedIds()).toEqual([clientId]);
  });

  it("venta con cliente dado de baja → 409", async () => {
    await api("delete", `/clients/${clientId}`).expect(204);
    expect((await sell().expect(409)).body.message).toBe("El cliente está dado de baja");
  });

  it.each([
    ["delete", "/clients/abc"],
    ["patch", "/clients/abc/activate"],
  ] as const)("%s %s → 400 ID inválido", async (method, url) => {
    const res = await api(method, url).expect(400);
    expect(res.body.errors).toContainEqual(expect.objectContaining({ path: ["id"], message: "ID inválido" }));
  });

  it.each([
    ["delete", "/clients/507f1f77bcf86cd799439099"],
    ["patch", "/clients/507f1f77bcf86cd799439099/activate"],
  ] as const)("%s cliente inexistente → 404", async (method, url) => {
    expect((await api(method, url).expect(404)).body.message).toBe("Cliente no encontrado");
  });

  it("includeInactive inválido → 400", async () => {
    const res = await api("get", "/clients?includeInactive=si").expect(400);
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({ path: ["includeInactive"], message: 'Opción inválida: se esperaba una de "true"|"false"' })
    );
  });
});
