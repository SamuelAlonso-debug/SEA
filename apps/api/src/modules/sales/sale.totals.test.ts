import { describe, expect, it } from "vitest";
import { computeTotals } from "./sale.totals";

describe("computeTotals", () => {
  it("1 ítem", () => {
    expect(computeTotals([{ unitPrice: 100, quantity: 1 }])).toEqual({ subtotal: 100, tax: 16, total: 116 });
  });

  it("varios ítems con cantidades > 1", () => {
    expect(
      computeTotals([
        { unitPrice: 10, quantity: 2 },
        { unitPrice: 2.5, quantity: 4 },
      ])
    ).toEqual({ subtotal: 30, tax: 4.8, total: 34.8 });
  });

  it("redondea a centavos sin residuos", () => {
    expect(computeTotals([{ unitPrice: 33.33, quantity: 3 }])).toEqual({ subtotal: 99.99, tax: 16, total: 115.99 });
  });
});
