import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";
import { startMongo } from "./mongo";

let db: Awaited<ReturnType<typeof startMongo>>;
const auth = `Bearer ${signToken({ userId: "507f1f77bcf86cd799439011" })}`;

beforeAll(async () => {
  db = await startMongo();
}, 300_000);

afterAll(() => db?.stop());

describe("rutas de KPIs de gastos", () => {
  it("/kpis responde; /kpis/month ya no existe", async () => {
    const res = await request(db.app).get("/api/expenses/kpis").set("Authorization", auth).expect(200);
    expect(res.body).toMatchObject({ totalAmountMonth: 0, totalCountMonth: 0 });
    await request(db.app).get("/api/expenses/kpis/month").set("Authorization", auth).expect(404);
  });
});
