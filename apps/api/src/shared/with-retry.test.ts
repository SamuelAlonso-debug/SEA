import { describe, expect, it, vi } from "vitest";
import { withRetry } from "./with-retry";

const prismaError = (code: string) => Object.assign(new Error(code), { code });

describe("withRetry", () => {
  it("reintenta P2034 y P2002 hasta que la función responde", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(prismaError("P2034"))
      .mockRejectedValueOnce(prismaError("P2002"))
      .mockResolvedValue("ok");
    await expect(withRetry(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("relanza otros errores sin reintentar", async () => {
    const fn = vi.fn().mockRejectedValue(prismaError("P2025"));
    await expect(withRetry(fn)).rejects.toMatchObject({ code: "P2025" });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("se rinde al agotar los intentos", async () => {
    const fn = vi.fn().mockRejectedValue(prismaError("P2034"));
    await expect(withRetry(fn, 3)).rejects.toMatchObject({ code: "P2034" });
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
