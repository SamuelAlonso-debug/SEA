import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { startMongo } from "./mongo";
import { bearer } from "./session";

// Una sola base por archivo; el limitador de auth admite 10 intentos por ventana.
let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());

const user = { name: "Ana", lastname: "Pérez", password: "secreto123", role: "CASHIER" };
// Las altas son de un ADMIN: no hay registro público.
const admin = bearer("ADMIN");

const WEB = "http://localhost:3000"; // origen permitido por defecto (CORS_ORIGIN)
const EXPIRED = "Sesión expirada. Inicia sesión de nuevo.";

describe("GET /api/auth/profile", () => {
  it("401 sin cookie", async () => {
    const res = await request(app).get("/api/auth/profile").expect(401);
    expect(res.body.message).toBe("No autenticado");
  });

  it("401 con un token sin sesión en la cookie", async () => {
    const res = await request(app).get("/api/auth/profile").set("Cookie", "sea_session=inventado").expect(401);
    expect(res.body.message).toBe(EXPIRED);
  });
});

describe("correo sin distinción de mayúsculas", () => {
  it("una cuenta por correo; login con cualquier capitalización", async () => {
    await request(app).post("/api/users").set("Authorization", admin).send({ ...user, email: "Ana@x.com" }).expect(201);

    const dup = await request(app).post("/api/users").set("Authorization", admin).send({ ...user, email: "ana@x.com" }).expect(409);
    expect(dup.body.message).toBe("El correo ya está registrado");
    expect(await db.prisma.user.count({ where: { email: "ana@x.com" } })).toBe(1);

    const login = await request(app).post("/api/auth/login").send({ email: "ANA@x.com", password: user.password }).expect(200);
    expect(login.body.user.email).toBe("ana@x.com");
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
    ["/api/users", { ...user, email: "no-es-correo" }, "email", "Correo inválido"],
    ["/api/auth/login", { email: "ana@x.com", password: "" }, "password", "La contraseña es obligatoria"],
  ])("400 en %s", async (url, body, path, message) => {
    const res = await request(app).post(url).set("Authorization", admin).send(body).expect(400);
    expect(res.body.issues).toContainEqual(expect.objectContaining({ path, message }));
  });
});

// Usa la cuenta creada arriba: el limitador de auth admite 10 intentos por ventana.
describe("sesión por cookie httpOnly", () => {
  const login = () =>
    request(app).post("/api/auth/login").set("Origin", WEB).send({ email: "ana@x.com", password: user.password }).expect(200);
  const sessionOf = (res: request.Response) => String(res.headers["set-cookie"]).split(";")[0];

  it("login emite la cookie segura y no devuelve el token en el cuerpo", async () => {
    const res = await login();
    expect(res.body).not.toHaveProperty("token");
    const cookie = String(res.headers["set-cookie"]);
    expect(cookie).toMatch(/^sea_session=[^;]+;/);
    for (const attr of ["HttpOnly", "Secure", "SameSite=Strict", "Path=/"]) expect(cookie).toContain(attr);

    const profile = await request(app).get("/api/auth/profile").set("Cookie", sessionOf(res)).expect(200);
    expect(profile.body).toMatchObject({ email: "ana@x.com", role: "CASHIER" });
    expect(profile.body).not.toHaveProperty("password");
  });

  it("logout responde 204, expira la cookie y revoca la sesión", async () => {
    const session = sessionOf(await login());
    const res = await request(app).post("/api/auth/logout").set("Origin", WEB).set("Cookie", session).expect(204);
    expect(String(res.headers["set-cookie"])).toMatch(/^sea_session=;.*Expires=Thu, 01 Jan 1970/);

    // El navegador sustituye la cookie por la vacía que devuelve el logout.
    const next = await request(app).get("/api/auth/profile").set("Cookie", sessionOf(res)).expect(401);
    expect(next.body.message).toBe("No autenticado");
    // Una copia del token anterior ya no vale.
    const copy = await request(app).get("/api/auth/profile").set("Cookie", session).expect(401);
    expect(copy.body.message).toBe(EXPIRED);
  });

  it.each([
    ["con Origin no permitido", { Origin: "https://evil.example" }],
    ["con cookie y sin Origin", { Cookie: "sea_session=x" }],
  ])("403 en escritura %s", async (_, headers) => {
    for (const method of ["post", "put", "patch", "delete"] as const) {
      const res = await request(app)[method]("/api/products/507f1f77bcf86cd799439011").set(headers).expect(403);
      expect(res.body.message).toBe("Origen no permitido");
    }
  });

  it("lecturas de cualquier origen y escrituras del permitido pasan la verificación", async () => {
    await request(app).get("/api/auth/profile").set("Origin", "https://evil.example").expect(401);
    await request(app).post("/api/products").set("Origin", WEB).send({}).expect(401);
  });
});
