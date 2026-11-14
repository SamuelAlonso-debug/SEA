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

const base = { name: "Ana", lastname: "Pérez", phone: "4421234567" };
const create = (body: object) => request(app).post("/api/clients").set("Authorization", auth).send(body);

describe("correo de clientes", () => {
  it("varios clientes sin correo", async () => {
    await create(base).expect(201);
    await create(base).expect(201);
    expect(await db.prisma.client.count()).toBe(2);
  });

  it("correo repetido → 409 sin documento creado", async () => {
    await create({ ...base, email: "ana@x.com" }).expect(201);
    const res = await create({ ...base, email: "ana@x.com" }).expect(409);
    expect(res.body.message).toBe("Ya existe un cliente con ese correo");
    expect(await db.prisma.client.count()).toBe(1);
  });

  it("correo sin distinción de mayúsculas", async () => {
    await create({ ...base, email: "A@x.com" }).expect(201);
    await create({ ...base, email: "a@x.com" }).expect(409);
  });

  it("PUT con el correo de otro cliente → 409; con el propio → 200", async () => {
    await create({ ...base, email: "ana@x.com" }).expect(201);
    const other = await create({ ...base, email: "eva@x.com" }).expect(201);
    const put = (email: string) =>
      request(app).put(`/api/clients/${other.body.id}`).set("Authorization", auth).send({ email });
    expect((await put("ANA@x.com").expect(409)).body.message).toBe("Ya existe un cliente con ese correo");
    await put("eva@x.com").expect(200);
  });

  it.each([
    [{ ...base, email: "no-es-correo" }, "email", "Correo inválido"],
    [{ ...base, phone: "123" }, "phone", "El teléfono es demasiado corto"],
  ])("400 en %j", async (body, path, message) => {
    const res = await create(body).expect(400);
    expect(res.body.errors).toContainEqual(expect.objectContaining({ path: [path], message }));
    expect(JSON.stringify(res.body)).not.toMatch(/prisma/i);
  });
});
