import { describe, expect, it } from "vitest";
import { marginOf, present } from "./product.margin";

describe("margen", () => {
  it("precio 100, costo 60 → 40 y 40 %", () => {
    expect(marginOf(100, 60)).toEqual({ margin: 40, marginPct: 40 });
  });

  it("redondea a centavos y a 2 decimales de porcentaje", () => {
    expect(marginOf(33.33, 11.11)).toEqual({ margin: 22.22, marginPct: 66.67 });
  });

  it("sin costo o con precio 0", () => {
    expect(marginOf(100, null)).toEqual({ margin: null, marginPct: null });
    expect(marginOf(0, 5)).toEqual({ margin: -5, marginPct: null });
  });

  it("aviso si el precio es menor que el costo", () => {
    expect(present({ price: 50, cost: 60 }, true).warnings).toEqual(["El precio es menor que el costo"]);
    expect(present({ price: 70, cost: 60 }, true).warnings).toEqual([]);
    expect(present({ price: 50, cost: 60 })).not.toHaveProperty("warnings");
  });
});
