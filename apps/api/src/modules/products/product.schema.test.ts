import { describe, expect, it } from "vitest";
import { stockEntrySchema, stockMovementSchema } from "./product.schema";

describe("stockEntrySchema", () => {
  it.each([0, -2, 1.5, "3"])("rechaza quantity %j", (quantity) => {
    const res = stockEntrySchema.safeParse({ quantity });
    expect(res.success).toBe(false);
    expect(res.error?.issues[0].message).toBe("La cantidad debe ser un entero mayor a 0");
  });

  it("rechaza un motivo de 256 caracteres", () => {
    const res = stockEntrySchema.safeParse({ quantity: 1, reason: "x".repeat(256) });
    expect(res.success).toBe(false);
    expect(res.error?.issues[0].path).toEqual(["reason"]);
  });

  it("acepta cantidad entera positiva y motivo opcional", () => {
    expect(stockEntrySchema.parse({ quantity: 3 })).toEqual({ quantity: 3 });
  });
});

describe("stockMovementSchema: reglas de signo por tipo", () => {
  const parse = (body: object) => stockMovementSchema.safeParse({ reason: "Conteo", ...body });

  it.each([
    [{ type: "WASTE", quantity: -3 }],
    [{ type: "ADJUSTMENT", quantity: -7 }],
    [{ type: "ADJUSTMENT", quantity: 4 }],
  ])("acepta %j", (body) => {
    expect(parse(body).success).toBe(true);
  });

  it.each([
    [{ type: "WASTE", quantity: 2 }, "Una merma debe ser negativa"],
    [{ type: "ADJUSTMENT", quantity: 0 }, "La cantidad debe ser un entero distinto de 0"],
    [{ type: "WASTE", quantity: -1.5 }, "La cantidad debe ser un entero distinto de 0"],
    [{ type: "PURCHASE", quantity: 1 }, 'Opción inválida: se esperaba una de "WASTE"|"ADJUSTMENT"'],
  ])("rechaza %j", (body, message) => {
    expect(parse(body).error?.issues[0].message).toBe(message);
  });

  it("exige motivo no vacío", () => {
    const res = parse({ type: "ADJUSTMENT", quantity: 1, reason: "  " });
    expect(res.error?.issues[0]).toMatchObject({ path: ["reason"], message: "El motivo es obligatorio" });
  });
});
