import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { startMongo } from "./mongo";
import { bearerFor, hashToken } from "./session";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());
beforeEach(() => db.reset());

const EXPIRED = "Sesión expirada. Inicia sesión de nuevo.";
const MINUTE = 60_000;

const cashier = () =>
  db.prisma.user.create({ data: { name: "Caja", lastname: "Uno", email: "caja@x.com", password: "x", role: "CASHIER" } });
const sessionOf = (auth: string) => db.prisma.session.findUniqueOrThrow({ where: { tokenHash: hashToken(auth.slice(7)) } });
const expenses = (auth: string) => request(app).get("/api/expenses").set("Authorization", auth);

describe("sesión verificada en cada petición", () => {
  it("cambio de rol en la base → aplica en la siguiente petición", async () => {
    const user = await cashier();
    const auth = await bearerFor(db.prisma, user.id);
    await expenses(auth).expect(403);

    await db.prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
    await expenses(auth).expect(200);
  });

  it("usuario borrado → 401", async () => {
    const user = await cashier();
    const auth = await bearerFor(db.prisma, user.id);
    await db.prisma.user.delete({ where: { id: user.id } });
    const res = await request(app).get("/api/clients").set("Authorization", auth).expect(401);
    expect(res.body.message).toBe(EXPIRED);
  });

  it.each([
    ["inactividad", () => ({ lastSeenAt: new Date(Date.now() - 31 * MINUTE) })],
    ["caducidad absoluta aun con actividad", () => ({ lastSeenAt: new Date(), expiresAt: new Date(Date.now() - 1) })],
  ])("%s → 401 y la sesión se borra", async (_, data) => {
    const user = await cashier();
    const auth = await bearerFor(db.prisma, user.id);
    const { id } = await sessionOf(auth);
    await db.prisma.session.update({ where: { id }, data: data() });

    const res = await request(app).get("/api/clients").set("Authorization", auth).expect(401);
    expect(res.body.message).toBe(EXPIRED);
    expect(await db.prisma.session.count({ where: { id } })).toBe(0);
  });

  it("actividad renueva lastSeenAt (como máximo una escritura por minuto)", async () => {
    const user = await cashier();
    const auth = await bearerFor(db.prisma, user.id);
    const { id } = await sessionOf(auth);
    const old = new Date(Date.now() - 29 * MINUTE);
    await db.prisma.session.update({ where: { id }, data: { lastSeenAt: old } });

    await request(app).get("/api/clients").set("Authorization", auth).expect(200);
    const touched = (await sessionOf(auth)).lastSeenAt;
    expect(touched.getTime()).toBeGreaterThan(old.getTime());

    await request(app).get("/api/clients").set("Authorization", auth).expect(200);
    expect((await sessionOf(auth)).lastSeenAt).toEqual(touched);
  });
});

describe("login", () => {
  it("en la base solo queda el hash del token; dura SESSION_MAX_HOURS", async () => {
    await db.prisma.user.create({
      data: { name: "Ana", lastname: "Ruiz", email: "ana@x.com", password: await bcrypt.hash("secreto123", 10), role: "ADMIN" },
    });
    const before = Date.now();
    const res = await request(app).post("/api/auth/login").send({ email: "ana@x.com", password: "secreto123" }).expect(200);
    const token = String(res.headers["set-cookie"]).match(/^sea_session=([^;]+)/)![1]!;

    expect(await db.prisma.session.count({ where: { tokenHash: token } })).toBe(0);
    const session = await db.prisma.session.findUniqueOrThrow({ where: { tokenHash: hashToken(token) } });
    // 12 h por defecto.
    expect(session.expiresAt.getTime() - before).toBeGreaterThanOrEqual(12 * 60 * MINUTE);
    expect(session.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(12 * 60 * MINUTE);
    expect(String(res.headers["set-cookie"])).toContain("Max-Age=43200");
  });
});
