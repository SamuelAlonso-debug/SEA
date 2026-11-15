import { afterEach, describe, expect, it, vi } from "vitest";
import { businessRanges } from "./business-time";

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
