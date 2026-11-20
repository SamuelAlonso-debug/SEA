import { afterEach, describe, expect, it, vi } from "vitest";

const load = () => import("./session");

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("configuración de la sesión", () => {
  it("sin variables: 30 min de inactividad y 12 h en total", async () => {
    vi.stubEnv("SESSION_IDLE_MINUTES", undefined);
    vi.stubEnv("SESSION_MAX_HOURS", undefined);
    const { SESSION_IDLE_MS, SESSION_MAX_MS } = await load();
    expect(SESSION_IDLE_MS).toBe(30 * 60_000);
    expect(SESSION_MAX_MS).toBe(12 * 3_600_000);
  });

  it("respeta los valores del entorno", async () => {
    vi.stubEnv("SESSION_IDLE_MINUTES", "5");
    vi.stubEnv("SESSION_MAX_HOURS", "1");
    const { SESSION_IDLE_MS, SESSION_MAX_MS } = await load();
    expect(SESSION_IDLE_MS).toBe(5 * 60_000);
    expect(SESSION_MAX_MS).toBe(3_600_000);
  });

  it.each(["0", "-1", "1.5", "abc", ""])("SESSION_IDLE_MINUTES=%j → no carga", async (value) => {
    vi.stubEnv("SESSION_IDLE_MINUTES", value);
    await expect(load()).rejects.toThrow("SESSION_IDLE_MINUTES debe ser un entero positivo");
  });

  it("SESSION_MAX_HOURS inválido → no carga", async () => {
    vi.stubEnv("SESSION_MAX_HOURS", "0");
    await expect(load()).rejects.toThrow("SESSION_MAX_HOURS debe ser un entero positivo");
  });
});

describe("isExpired", () => {
  const now = Date.UTC(2026, 0, 1, 12);
  const at = (ms: number) => new Date(now + ms);
  const far = at(3_600_000);

  it.each([
    ["activa", { lastSeenAt: at(-29 * 60_000), expiresAt: far }, false],
    ["inactividad exacta", { lastSeenAt: at(-30 * 60_000), expiresAt: far }, true],
    ["caducidad absoluta exacta", { lastSeenAt: at(0), expiresAt: at(0) }, true],
  ])("%s", async (_, session, expected) => {
    const { isExpired } = await load();
    expect(isExpired(session, now)).toBe(expected);
  });
});
