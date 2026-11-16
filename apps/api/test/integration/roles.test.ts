import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { startMongo } from "./mongo";
import { signToken } from "../../src/shared/jwt";
import { seedAdmin } from "../../prisma/seed-admin.mjs";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());

const ID = "507f1f77bcf86cd799439011";
const bearer = (role: "ADMIN" | "CASHIER") => `Bearer ${signToken({ userId: ID, role })}`;
const FORBIDDEN = "No tienes permiso para esta acción";
const cashier = { name: "Caja", lastname: "Uno", email: "caja@x.com", password: "secreto123", role: "CASHIER" };

describe("registro público eliminado", () => {
  it("POST /api/auth/register → 404 y no crea usuario", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Eva", lastname: "Mala", email: "eva@x.com", password: "secreto123" })
      .expect(404);
    expect(res.body.message).toBe("Ruta no encontrada");
    expect(await db.prisma.user.count()).toBe(0);
  });

  it("token sin role (anterior al cambio) → 401", async () => {
    const legacy = jwt.sign({ userId: ID }, "test-secret");
    const res = await request(app).get("/api/clients").set("Authorization", `Bearer ${legacy}`).expect(401);
    expect(res.body.message).toBe("Sesión expirada. Inicia sesión de nuevo.");
  });
});

// [método, ruta, código esperado para CASHIER]. ADMIN nunca recibe 403.
// Las escrituras van con cuerpo vacío: pasar el permiso se ve en el 400 de validación.
const matrix: [("get" | "post"), string, number][] = [
  ["get", "/api/clients", 200],
  ["post", "/api/clients", 400],
  ["get", "/api/sales", 200],
  ["post", "/api/sales", 400],
  ["get", "/api/products", 200],
  ["post", "/api/products", 403],
  ["post", `/api/products/${ID}/stock`, 403],
  ["get", `/api/products/${ID}/movements`, 404],
  ["post", `/api/products/${ID}/movements`, 403],
  ["get", "/api/products/export", 403],
  ["get", "/api/products/import/template", 403],
  ["post", "/api/products/import", 403],
  ["get", "/api/sales/export", 403],
  ["post", `/api/sales/${ID}/cancel`, 403],
  ["get", "/api/expenses/export", 403],
  ["get", "/api/kpis/profit", 403],
  ["get", "/api/catalogs", 200],
  ["get", "/api/expenses", 403],
  ["post", "/api/expenses", 403],
  ["get", "/api/kpis/header", 403],
  ["get", "/api/kpis/low-stock", 403],
  ["get", "/api/users", 403],
  ["post", "/api/users", 403],
];

describe("permisos por rol en cada módulo", () => {
  it.each(matrix)("CASHIER %s %s → %i", async (method, url, status) => {
    const res = await request(app)[method](url).set("Authorization", bearer("CASHIER")).send({});
    expect(res.status).toBe(status);
    if (status === 403) expect(res.body.message).toBe(FORBIDDEN);
  });

  it.each(matrix)("ADMIN %s %s → sin 403", async (method, url) => {
    const res = await request(app)[method](url).set("Authorization", bearer("ADMIN")).send({});
    expect(res.status).not.toBe(403);
    expect(res.status).toBeLessThan(500);
  });
});

describe("POST /api/users", () => {
  it("ADMIN da de alta un CASHIER (201, sin hash) que inicia sesión con su rol", async () => {
    const res = await request(app).post("/api/users").set("Authorization", bearer("ADMIN")).send(cashier).expect(201);
    expect(res.body).toMatchObject({ email: "caja@x.com", role: "CASHIER" });
    expect(res.body).not.toHaveProperty("password");

    const login = await request(app).post("/api/auth/login").send({ email: cashier.email, password: cashier.password }).expect(200);
    expect(login.body.user.role).toBe("CASHIER");
    const session = String(login.headers["set-cookie"]).split(";")[0];
    await request(app).get("/api/clients").set("Cookie", session).expect(200);
    const denied = await request(app).get("/api/expenses").set("Cookie", session).expect(403);
    expect(denied.body.message).toBe(FORBIDDEN);

    const list = await request(app).get("/api/users").set("Authorization", bearer("ADMIN")).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).not.toHaveProperty("password");
  });

  it.each([
    [{ ...cashier, email: "otro@x.com", role: "OWNER" }, 400, "role", 'Opción inválida: se esperaba una de "ADMIN"|"CASHIER"'],
    [{ ...cashier, email: "otro@x.com", password: "1234567" }, 400, "password", "La contraseña debe tener al menos 8 caracteres"],
  ])("400 por %#", async (body, status, path, message) => {
    const res = await request(app).post("/api/users").set("Authorization", bearer("ADMIN")).send(body).expect(status);
    expect(res.body.errors).toContainEqual(expect.objectContaining({ path: [path], message }));
  });

  it("409 con correo existente", async () => {
    const res = await request(app).post("/api/users").set("Authorization", bearer("ADMIN")).send(cashier).expect(409);
    expect(res.body.message).toBe("El correo ya está registrado");
  });
});

describe("seed-admin", () => {
  const env = { email: " Jefa@X.com ", password: "admin-temporal-1" };

  it("crea el ADMIN, asigna CASHIER a usuarios sin rol y es idempotente", async () => {
    await db.prisma.$runCommandRaw({
      insert: "User",
      documents: [{ name: "Viejo", lastname: "Registro", email: "viejo@x.com", password: "x", createdAt: { $date: new Date().toISOString() }, updatedAt: { $date: new Date().toISOString() } }],
    });

    expect(await seedAdmin(db.prisma, env)).toEqual({ created: true, legacyAssigned: 1 });
    expect(await seedAdmin(db.prisma, env)).toEqual({ created: false, legacyAssigned: 0 });

    expect((await db.prisma.user.findUnique({ where: { email: "jefa@x.com" } }))?.role).toBe("ADMIN");
    expect((await db.prisma.user.findUnique({ where: { email: "viejo@x.com" } }))?.role).toBe("CASHIER");
    const login = await request(app).post("/api/auth/login").send({ email: "jefa@x.com", password: env.password }).expect(200);
    expect(login.body.user.role).toBe("ADMIN");
  });

  it("rechaza contraseña corta sin tocar nada", async () => {
    await expect(seedAdmin(db.prisma, { email: "a@x.com", password: "corta" })).rejects.toThrow("ADMIN_PASSWORD");
  });
});
