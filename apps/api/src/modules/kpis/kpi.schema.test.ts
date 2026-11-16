import { describe, expect, it } from "vitest";
import { periodQuerySchema } from "./kpi.schema";

const issues = (q: unknown) => {
  const r = periodQuerySchema.safeParse(q);
  return r.success ? [] : r.error.issues.map((i) => ({ path: i.path, message: i.message }));
};

describe("periodQuerySchema", () => {
  it.each(["TODAY", "MONTH"])("acepta period=%s", (period) => {
    expect(periodQuerySchema.parse({ period })).toEqual({ period });
  });

  it("acepta rango y query vacío", () => {
    expect(issues({ from: "2026-10-01", to: "2026-10-31" })).toEqual([]);
    expect(issues({})).toEqual([]);
  });

  it("rechaza un periodo desconocido", () => {
    expect(issues({ period: "WEEK" })).toEqual([
      { path: ["period"], message: 'Opción inválida: se esperaba una de "TODAY" o "MONTH"' },
    ]);
  });

  it.each([{ from: "2026-10-01", to: "2026-10-31" }, { from: "2026-10-01" }, { to: "2026-10-31" }])("rechaza period con %j", (range) => {
    expect(issues({ period: "TODAY", ...range })).toEqual([{ path: ["period"], message: "Indica periodo o rango, no ambos" }]);
  });
});
