import { describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app";

describe("GET /api/auth/profile", () => {
  it("401 sin token", async () => {
    await request(app).get("/api/auth/profile").expect(401);
  });

  it("401 con token firmado con otro secreto", async () => {
    const forged = jwt.sign({ userId: "507f1f77bcf86cd799439011" }, "default_secret");
    await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${forged}`)
      .expect(401);
  });
});
