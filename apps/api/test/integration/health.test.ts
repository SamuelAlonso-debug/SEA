import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { startMongo } from "./mongo";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

// La segunda prueba detiene la BD; solo se detiene aquí si no llegó a hacerlo.
let stopped = false;
afterAll(() => (stopped ? undefined : db?.stop()));

describe("health", () => {
  it("BD arriba → liveness y readiness 200", async () => {
    expect((await request(app).get("/api/health").expect(200)).body.status).toBe("ok");
    expect((await request(app).get("/api/health/ready").expect(200)).body).toEqual({ status: "ready" });
  });

  it("BD caída → liveness 200, readiness 503 en menos de 3 s", async () => {
    await db.stop();
    stopped = true;
    await request(app).get("/api/health").expect(200);

    const start = Date.now();
    const res = await request(app).get("/api/health/ready").expect(503);
    expect(Date.now() - start).toBeLessThan(3000);
    expect(res.body).toEqual({ status: "unavailable" });
  });
});
