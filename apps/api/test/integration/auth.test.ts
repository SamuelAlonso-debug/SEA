import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { startMongo } from "./mongo";

// Una sola base por archivo; el limitador de auth admite 10 intentos por ventana.
let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());

const user = { name: "Ana", lastname: "Pérez", password: "secreto123" };

describe("GET /api/auth/profile", () => {
  it("401 sin token", async () => {
    await request(app).get("/api/auth/profile").expect(401);
  });

  it("401 con token firmado con otro secreto", async () => {
    const forged = jwt.sign({ userId: "507f1f77bcf86cd799439011" }, "default_secret");
    await request(app).get("/api/auth/profile").set("Authorization", `Bearer ${forged}`).expect(401);
  });
});

describe("correo sin distinción de mayúsculas", () => {
  it("una cuenta por correo; login con cualquier capitalización", async () => {
    await request(app).post("/api/auth/register").send({ ...user, email: "Ana@x.com" }).expect(201);

    const dup = await request(app).post("/api/auth/register").send({ ...user, email: "ana@x.com" }).expect(409);
    expect(dup.body.message).toBe("El correo ya está registrado");
    expect(await db.prisma.user.count()).toBe(1);

    const login = await request(app).post("/api/auth/login").send({ email: "ANA@x.com", password: user.password }).expect(200);
    expect(login.body.token).toEqual(expect.any(String));
  });

  it("login fallido no distingue correo inexistente de contraseña incorrecta", async () => {
    const wrong = await request(app).post("/api/auth/login").send({ email: "ana@x.com", password: "otra" });
    const missing = await request(app).post("/api/auth/login").send({ email: "nadie@x.com", password: "otra" });
    for (const res of [wrong, missing]) {
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Correo o contraseña incorrectos");
    }
  });

  it.each([
    ["/api/auth/register", { ...user, email: "no-es-correo" }, "email", "Correo inválido"],
    ["/api/auth/login", { email: "ana@x.com", password: "" }, "password", "La contraseña es obligatoria"],
  ])("400 en %s", async (url, body, path, message) => {
    const res = await request(app).post(url).send(body).expect(400);
    expect(res.body.errors).toContainEqual(expect.objectContaining({ path: [path], message }));
  });
});
