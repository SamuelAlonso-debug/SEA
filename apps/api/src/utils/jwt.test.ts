import { afterEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { signToken, verifyToken } from "./jwt";

describe("jwt", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("verifica un token propio", () => {
    expect(verifyToken(signToken({ userId: "u1" })).userId).toBe("u1");
  });

  it("rechaza un token firmado con otro secreto", () => {
    const forged = jwt.sign({ userId: "u1" }, "default_secret");
    expect(() => verifyToken(forged)).toThrow();
  });

  it("rechaza un token sin firma (alg none)", () => {
    const unsigned = jwt.sign({ userId: "u1" }, "", { algorithm: "none" });
    expect(() => verifyToken(unsigned)).toThrow();
  });

  it("no carga sin JWT_SECRET", async () => {
    vi.stubEnv("JWT_SECRET", "");
    await expect(import("./jwt")).rejects.toThrow("JWT_SECRET");
  });
});
