import { describe, expect, it } from "vitest";
import { toSortName } from "./client.sort-name";

describe("toSortName", () => {
  it("ignora mayúsculas y acentos y recorta", () => {
    expect(toSortName("Óscar", "Pérez")).toBe("oscar perez");
    expect(toSortName("ANA", "")).toBe("ana");
  });
});
