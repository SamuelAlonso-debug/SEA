import { describe, expect, it } from "vitest";
import { IMPORT_HEADERS, ImportError, parseProductsCsv } from "./product.import";

const H = IMPORT_HEADERS.join(",");
const parse = (csv: string) => parseProductsCsv(Buffer.from(csv, "utf8"));
const fileError = (csv: string) => {
  try {
    parse(csv);
  } catch (e) {
    return e as ImportError;
  }
  throw new Error("no lanzó");
};

describe("parseProductsCsv", () => {
  it("parsea comillas, comas y saltos de línea dentro de campos, y el BOM", () => {
    const { products, errors } = parse(`\uFEFF${H}\r\nA1,"Arroz, ""extra""\nlargo",Granos,10.5,6,5,2,Acme\r\n`);
    expect(errors).toEqual([]);
    expect(products[0]).toMatchObject({ productCode: "A1", name: 'Arroz, "extra"\nlargo', price: 10.5, minStock: 2 });
  });

  it("acepta ';' con coma decimal y deja opcionales vacíos", () => {
    const { products, errors } = parse(`${H.replaceAll(",", ";")}\nA1;Arroz;;10,5;6;5;;\n`);
    expect(errors).toEqual([]);
    expect(products[0]).toMatchObject({ price: 10.5, category: undefined, minStock: undefined });
  });

  it("no evalúa fórmulas: el texto se conserva tal cual", () => {
    expect(parse(`${H}\nA1,=1+1,,1,1,1,,\n`).products[0].name).toBe("=1+1");
  });

  it("reporta fila, path y mensaje del schema del alta", () => {
    const { products, errors } = parse(`${H}\nA1,Arroz,,10,6,5,,\nA2,Frijol,,abc,6,5,,\nA3,F,,10,,5,,\n`);
    expect(products).toHaveLength(1);
    expect(errors).toEqual([
      { row: 3, path: "price", message: "El precio debe ser un número" },
      { row: 4, path: "name", message: "El nombre debe tener al menos 2 caracteres" },
      { row: 4, path: "cost", message: "El costo es obligatorio" },
    ]);
  });

  it("código repetido dentro del archivo y columnas de más", () => {
    const { errors } = parse(`${H}\nA1,Arroz,,10,6,5,,\nA1,Otro,,10,6,5,,\nA2,Frijol,,10\n`);
    expect(errors).toEqual([
      { row: 3, path: "productCode", message: "Código repetido en la fila 2" },
      { row: 4, path: "columns", message: "Se esperaban 8 columnas y hay 4" },
    ]);
  });

  it("errores de archivo: encabezados, vacío, más de 2000 filas, comillas sin cerrar", () => {
    expect(fileError("a,b\n1,2").message).toBe(`Encabezados inválidos. Usa la plantilla: ${H}`);
    expect(fileError(`${H}\n`).message).toBe("El archivo no tiene productos");
    const many = Array.from({ length: 2001 }, (_, i) => `C${i},N${i},,1,1,1,,`).join("\n");
    expect(fileError(`${H}\n${many}`)).toMatchObject({ status: 400, message: "Máximo 2000 productos por archivo" });
    expect(fileError(`${H}\nA1,"Arroz,,1,1,1,,\n`).status).toBe(400);
  });
});
