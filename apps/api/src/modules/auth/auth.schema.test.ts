import { describe, expect, it } from "vitest";
import { createUserSchema, loginSchema } from "./auth.schema";

const valid = { name: "Ana", lastname: "Pérez", email: "  Ana@X.com ", password: "secreto123", role: "CASHIER" };

describe("normalización de correo", () => {
  it("alta: recorta y pasa a minúsculas", () => {
    expect(createUserSchema.parse(valid).email).toBe("ana@x.com");
  });

  it("login: recorta y pasa a minúsculas", () => {
    expect(loginSchema.parse({ email: " ANA@x.COM", password: "x" }).email).toBe("ana@x.com");
  });
});

describe("alta de usuario", () => {
  it.each([
    [{ role: "OWNER" }, "role", 'Opción inválida: se esperaba una de "ADMIN"|"CASHIER"'],
    [{ password: "1234567" }, "password", "La contraseña debe tener al menos 8 caracteres"],
  ])("rechaza %o", (patch, path, message) => {
    const result = createUserSchema.safeParse({ ...valid, ...patch });
    expect(result.error?.issues).toContainEqual(expect.objectContaining({ path: [path], message }));
  });
});
