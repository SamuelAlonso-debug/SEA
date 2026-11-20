import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { bearer } from "./session";
import { startMongo } from "./mongo";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;
const auth = bearer("ADMIN");
const get = (url: string) => request(app).get(url).set("Authorization", auth);

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());
afterEach(() => vi.restoreAllMocks());

describe("manejo de errores central", () => {
  it("validación Zod → 400 Datos inválidos con issues por campo", async () => {
    const res = await request(app).post("/api/products").set("Authorization", auth).send({ name: "a", price: -1 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Datos inválidos");
    const paths = res.body.issues.map((i: { path: string }) => i.path);
    expect(paths).toEqual(expect.arrayContaining(["name", "price", "productCode", "stock"]));
  });

  it("id que no es ObjectId → 400 con issue en id, sin texto de Prisma", async () => {
    const res = await get("/api/products/not-an-id");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Datos inválidos", issues: [{ path: "id", message: "ID inválido" }] });
  });

  it.each(["/api/products", "/api/clients", "/api/sales", "/api/expenses"])("%s/<id inválido> → 400", async (base) => {
    expect((await get(`${base}/abc`)).body.issues).toEqual([{ path: "id", message: "ID inválido" }]);
  });

  it.each([
    ["/api/products", "Producto no encontrado"],
    ["/api/clients", "Cliente no encontrado"],
    ["/api/sales", "Venta no encontrada"],
    ["/api/expenses", "Gasto no encontrado"],
  ])("%s/<ObjectId inexistente> → 404", async (base, message) => {
    const res = await get(`${base}/507f1f77bcf86cd799439099`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message });
  });

  it("JSON malformado → 400 JSON inválido", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", auth)
      .set("Content-Type", "application/json")
      .send('{"name": ');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "JSON inválido" });
  });

  it("ruta inexistente → 404 Ruta no encontrada", async () => {
    const res = await request(app).get("/api/no-existe");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Ruta no encontrada" });
  });

  it("BD caída → 500 Error interno sin detalles; el original va al log", async () => {
    const original = new Error("Server selection timeout at /home/app/src/client.service.ts:29:37");
    vi.spyOn(db.prisma.client, "count").mockRejectedValue(original);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await get("/api/clients");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Error interno" });
    expect(log).toHaveBeenCalledWith(original);
  });
});
