import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";
import { startMongo } from "./mongo";
import { toSortName } from "../../src/modules/clients/client.sort-name";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;
const auth = `Bearer ${signToken({ userId: "507f1f77bcf86cd799439011" })}`;

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
  // Índice del despliegue de #75: `db push` no crea índices parciales.
  await db.prisma.$runCommandRaw({
    createIndexes: "Client",
    indexes: [{ key: { email: 1 }, name: "Client_email_key", unique: true, partialFilterExpression: { email: { $type: "string" } } }],
  });
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

  it("altas simultáneas con el mismo correo → un 201 y un 409", async () => {
    const res = await Promise.all([create({ ...base, email: "ana@x.com" }), create({ ...base, email: "ana@x.com" })]);
    expect(res.map((r) => r.status).sort()).toEqual([201, 409]);
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
    expect(res.body.issues).toContainEqual(expect.objectContaining({ path, message }));
    expect(JSON.stringify(res.body)).not.toMatch(/prisma/i);
  });
});

describe("orden del listado", () => {
  const list = async (query = "") =>
    (await request(app).get(`/api/clients${query}`).set("Authorization", auth).expect(200)).body.data.map(
      (c: any) => `${c.name} ${c.lastname}`,
    );

  beforeEach(async () => {
    // Altas en orden distinto al alfabético para distinguir ambos criterios.
    for (const [name, lastname] of [["Luis", "Zamora"], ["Ana", "Soto"], ["Ana", "Pérez"]]) {
      await db.prisma.client.create({ data: { name, lastname, sortName: toSortName(name, lastname), phone: "4421234567" } });
      await new Promise((r) => setTimeout(r, 5));
    }
  });

  it("sin sortBy o CREATED_AT → más reciente primero", async () => {
    const recent = ["Ana Pérez", "Ana Soto", "Luis Zamora"];
    expect(await list()).toEqual(recent);
    expect(await list("?sortBy=CREATED_AT")).toEqual(recent);
  });

  it("NAME → nombre y apellido ascendente, con search e includeInactive", async () => {
    expect(await list("?sortBy=NAME")).toEqual(["Ana Pérez", "Ana Soto", "Luis Zamora"]);
    expect(await list("?sortBy=NAME&search=ana")).toEqual(["Ana Pérez", "Ana Soto"]);
    const luis = await db.prisma.client.findFirstOrThrow({ where: { name: "Luis" } });
    await db.prisma.client.update({ where: { id: luis.id }, data: { isActive: false } });
    expect(await list("?sortBy=NAME")).toEqual(["Ana Pérez", "Ana Soto"]);
    expect(await list("?sortBy=NAME&includeInactive=true")).toEqual(["Ana Pérez", "Ana Soto", "Luis Zamora"]);
  });

  it("NAME ignora mayúsculas y acentos y pagina sobre el orden completo", async () => {
    await db.prisma.client.deleteMany();
    for (const name of ["Zoe", "ana", "Óscar", "Bea"]) {
      await db.prisma.client.create({ data: { name, lastname: "X", sortName: toSortName(name, "X"), phone: "4421234567" } });
    }
    expect(await list("?sortBy=NAME")).toEqual(["ana X", "Bea X", "Óscar X", "Zoe X"]);
    expect(await list("?sortBy=NAME&page=2&pageSize=2")).toEqual(["Óscar X", "Zoe X"]);
  });

  it("sortBy inválido → 400 con path y mensaje", async () => {
    const res = await request(app).get("/api/clients?sortBy=PHONE").set("Authorization", auth).expect(400);
    expect(res.body.issues).toContainEqual(
      expect.objectContaining({ path: "sortBy", message: 'Opción inválida: se esperaba una de "CREATED_AT" o "NAME"' }),
    );
  });
});
