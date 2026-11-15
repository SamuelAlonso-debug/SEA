import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth.schema";

describe("normalización de correo", () => {
  it("alta: recorta y pasa a minúsculas", () => {
    const data = registerSchema.parse({ name: "Ana", lastname: "Pérez", email: "  Ana@X.com ", password: "secreto123" });
    expect(data.email).toBe("ana@x.com");
  });

  it("login: recorta y pasa a minúsculas", () => {
    expect(loginSchema.parse({ email: " ANA@x.COM", password: "x" }).email).toBe("ana@x.com");
  });
});
