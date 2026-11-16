import { describe, expect, it } from "vitest";
import { csvCell, csvRow, paged } from "./csv";

describe("csvCell", () => {
  it("deja intacto el texto simple, los números y vacía null/undefined", () => {
    expect(csvCell("Café")).toBe("Café");
    expect(csvCell(12.5)).toBe("12.5");
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("entrecomilla comas, comillas y saltos de línea duplicando las comillas", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('di "hola"')).toBe('"di ""hola"""');
    expect(csvCell("uno\ndos")).toBe('"uno\ndos"');
    expect(csvCell("uno\r\ndos")).toBe('"uno\r\ndos"');
  });

  it.each(["=SUM(A1)", "+1", "-1", "@cmd", "\tx", "\rx"])("neutraliza la fórmula %j", (value) => {
    expect(csvCell(value).replace(/^"/, "")).toMatch(/^'/);
  });

  it("no altera los números negativos", () => {
    expect(csvCell(-5)).toBe("-5");
  });

  it("neutraliza y entrecomilla a la vez", () => {
    expect(csvCell('=HYPERLINK("x","y")')).toBe(`"'=HYPERLINK(""x"",""y"")"`);
  });
});

describe("csvRow", () => {
  it("une con comas y termina en CRLF", () => {
    expect(csvRow(["a", 1, null, "b,c"])).toBe('a,1,,"b,c"\r\n');
  });
});

describe("paged", () => {
  it("recorre todas las páginas con cursor y se detiene en la última incompleta", async () => {
    const all = Array.from({ length: 5 }, (_, i) => ({ id: String(i) }));
    const calls: unknown[] = [];
    const find = async ({ take, cursor }: { take: number; cursor?: { id: string } }) => {
      calls.push(cursor?.id);
      const start = cursor ? Number(cursor.id) + 1 : 0;
      return all.slice(start, start + take);
    };
    const out: string[] = [];
    for await (const row of paged(find, 2)) out.push(row.id);
    expect(out).toEqual(["0", "1", "2", "3", "4"]);
    expect(calls).toEqual([undefined, "1", "3"]);
  });
});
