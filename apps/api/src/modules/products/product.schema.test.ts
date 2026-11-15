import { describe, expect, it } from "vitest";
import { stockEntrySchema } from "./product.schema";

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
