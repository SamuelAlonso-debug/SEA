import { describe, expect, it } from "vitest";
import { computeProfit, MISSING_COST_WARNING } from "./kpi.profit";

describe("computeProfit", () => {
  it("ventas 1000, costo 600, gastos 250 → bruta 400, neta 150, margen 15", () => {
    const sales = [
      { subtotal: 700, items: [{ quantity: 2, unitCost: 200 }] },
      { subtotal: 300, items: [{ quantity: 1, unitCost: 200 }] },
    ];
    const expenses = [
      { category: "rent", amount: 200 },
      { category: "service", amount: 50 },
    ];
    expect(computeProfit(sales, expenses)).toEqual({
      netSales: 1000,
      costOfGoodsSold: 600,
      grossProfit: 400,
      expenses: 250,
      netProfit: 150,
      marginPct: 15,
      itemsWithoutCost: 0,
      warnings: [],
    });
  });

  it("una venta cancelada no suma ni en ventas ni en costo", () => {
    const res = computeProfit(
      [
        { status: "COMPLETED", subtotal: 100, items: [{ quantity: 1, unitCost: 60 }] },
        { status: "PARTIALLY_REFUNDED", subtotal: 50, items: [{ quantity: 1, unitCost: 30 }] },
        { status: "CANCELLED", subtotal: 999, items: [{ quantity: 5, unitCost: 100 }] },
      ],
      []
    );
    expect(res).toMatchObject({ netSales: 150, costOfGoodsSold: 90, grossProfit: 60 });
  });

  it("ítem sin unitCost: fuera del costo, contado y con aviso", () => {
    const res = computeProfit(
      [{ subtotal: 100, items: [{ quantity: 1, unitCost: 40 }, { quantity: 3, unitCost: null }] }],
      []
    );
    expect(res).toMatchObject({ costOfGoodsSold: 40, itemsWithoutCost: 1, warnings: [MISSING_COST_WARNING] });
  });

  it("gastos de mercancía no se restan: ya están en el costo de lo vendido", () => {
    const res = computeProfit([], [
      { category: "merchandise", amount: 500 },
      { category: "rent", amount: 100 },
    ]);
    expect(res).toMatchObject({ expenses: 100, netProfit: -100, marginPct: null });
  });

  it("sin ventas ni gastos: todo en 0 y margen null", () => {
    expect(computeProfit([], [])).toEqual({
      netSales: 0,
      costOfGoodsSold: 0,
      grossProfit: 0,
      expenses: 0,
      netProfit: 0,
      marginPct: null,
      itemsWithoutCost: 0,
      warnings: [],
    });
  });

  it("suma en centavos: sin residuos de coma flotante", () => {
    const res = computeProfit(
      [{ subtotal: 0.1, items: [] }, { subtotal: 0.2, items: [{ quantity: 3, unitCost: 0.1 }] }],
      []
    );
    expect(res).toMatchObject({ netSales: 0.3, costOfGoodsSold: 0.3, grossProfit: 0 });
  });
});
