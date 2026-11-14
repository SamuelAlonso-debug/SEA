import { afterEach, describe, expect, it, vi } from "vitest";
import { businessRanges, currentMonth, percentChange, previousPeriod, rangeOf } from "./business-time";

const MX = "America/Mexico_City"; // UTC−6, sin horario de verano

describe("businessRanges", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("cambio de día: 20:00 local sigue siendo el día D", () => {
    const r = businessRanges(new Date("2026-11-14T02:00:00Z"), MX); // 13-nov 20:00 local
    expect(r.startOfToday.toISOString()).toBe("2026-11-13T06:00:00.000Z");
    expect(r.startOfTomorrow.toISOString()).toBe("2026-11-14T06:00:00.000Z");
  });

  it("fin de mes: 30-nov 23:00 local es noviembre", () => {
    const r = businessRanges(new Date("2026-12-01T05:00:00Z"), MX);
    expect(r.month).toBe(11);
    expect(r.startOfMonth.toISOString()).toBe("2026-11-01T06:00:00.000Z");
    expect(r.startOfNextMonth.toISOString()).toBe("2026-12-01T06:00:00.000Z");
  });

  it("fin de año: 31-dic 23:00 local es diciembre del mismo año", () => {
    const r = businessRanges(new Date("2027-01-01T05:00:00Z"), MX);
    expect([r.year, r.month]).toEqual([2026, 12]);
    expect(r.startOfTomorrow.toISOString()).toBe("2027-01-01T06:00:00.000Z");
    expect(r.startOfNextMonth.toISOString()).toBe("2027-01-01T06:00:00.000Z");
  });

  it("zona con horario de verano", () => {
    const r = businessRanges(new Date("2026-03-08T12:00:00Z"), "America/New_York"); // día del cambio
    expect(r.startOfToday.toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(r.startOfTomorrow.toISOString()).toBe("2026-03-09T04:00:00.000Z");
  });

  it.each([
    ["", "BUSINESS_TIMEZONE no está definido"],
    ["Foo/Bar", "BUSINESS_TIMEZONE inválido: Foo/Bar"],
  ])("no carga con %j", async (value, message) => {
    vi.stubEnv("BUSINESS_TIMEZONE", value);
    await expect(import("./business-time")).rejects.toThrow(message);
  });
});

describe("periodo anterior y variación", () => {
  it("mes completo → mes anterior", () => {
    expect(previousPeriod({ from: "2026-10-01", to: "2026-10-31" })).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(previousPeriod({ from: "2026-03-01", to: "2026-03-31" })).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    expect(previousPeriod({ from: "2026-01-01", to: "2026-12-31" })).toEqual({ from: "2025-01-01", to: "2025-12-31" });
  });

  it("rango libre → misma duración inmediatamente antes", () => {
    expect(previousPeriod({ from: "2026-11-08", to: "2026-11-14" })).toEqual({ from: "2026-11-01", to: "2026-11-07" });
    expect(previousPeriod({ from: "2026-01-01", to: "2026-01-01" })).toEqual({ from: "2025-12-31", to: "2025-12-31" });
  });

  it("mes en curso y rango en hora del negocio", () => {
    expect(currentMonth(new Date("2026-12-01T05:00:00Z"), MX)).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    const r = rangeOf({ from: "2026-10-01", to: "2026-10-31" }, MX);
    expect([r.start.toISOString(), r.end.toISOString(), r.month]).toEqual(["2026-10-01T06:00:00.000Z", "2026-11-01T06:00:00.000Z", 10]);
  });

  it("variación, incluida división entre 0", () => {
    expect(percentChange(1000, 800)).toBe(25);
    expect(percentChange(500, 800)).toBe(-37.5);
    expect(percentChange(10, 0)).toBeNull();
  });
});
