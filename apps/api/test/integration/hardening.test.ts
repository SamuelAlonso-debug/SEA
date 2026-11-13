import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";

describe("hardening HTTP", () => {
  it("responde con cabeceras de Helmet y sin x-powered-by", async () => {
    const res = await request(app).get("/api/health").expect(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("413 con body mayor a 100kb", async () => {
    await request(app)
      .post("/api/products")
      .send({ data: "x".repeat(101 * 1024) })
      .expect(413);
  });

  it("429 tras 10 intentos de login en la ventana", async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post("/api/auth/login").send({}).expect(400);
    }
    await request(app).post("/api/auth/login").send({}).expect(429);
  });
});
