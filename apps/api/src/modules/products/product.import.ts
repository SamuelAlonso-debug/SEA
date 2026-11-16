import { parse } from "csv-parse/sync";
import prisma from "../../shared/prisma";
import { createProductSchema, CreateProductInput } from "./product.schema";

export const IMPORT_HEADERS = ["productCode", "name", "category", "price", "cost", "stock", "minStock", "provider"];
export const IMPORT_MAX_ROWS = 2000;
export const IMPORT_MAX_BYTES = 1024 * 1024;

export interface RowError {
  row: number; // fila del archivo: la 1 es el encabezado
  path: string;
  message: string;
}

export class ImportError extends Error {
  constructor(public status: number, message: string, public rows?: RowError[]) {
    super(message);
  }
}

const countMessage = (n: number) => `El archivo tiene ${n} ${n === 1 ? "error" : "errores"}`;

// Una librería parsea el CSV (comillas, saltos de línea dentro de campos, BOM);
// aquí solo se mapea cada fila al schema del alta. Nunca se evalúan fórmulas: todo es texto.
export function parseProductsCsv(buffer: Buffer): { products: CreateProductInput[]; errors: RowError[] } {
  const text = buffer.toString("utf8");
  // Excel en español exporta con ";" y coma decimal.
  const header = text.replace(/^﻿/, "").split(/\r?\n/, 1)[0] ?? "";
  const semicolon = header.includes(";") && !header.includes(",");

  let records: string[][];
  try {
    records = parse(text, {
      bom: true,
      delimiter: semicolon ? ";" : ",",
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    });
  } catch {
    throw new ImportError(400, "El archivo no es un CSV válido");
  }

  if (records[0]?.join(",") !== IMPORT_HEADERS.join(",")) {
    throw new ImportError(400, `Encabezados inválidos. Usa la plantilla: ${IMPORT_HEADERS.join(",")}`);
  }
  const rows = records.slice(1);
  if (rows.length === 0) throw new ImportError(400, "El archivo no tiene productos");
  if (rows.length > IMPORT_MAX_ROWS) throw new ImportError(400, `Máximo ${IMPORT_MAX_ROWS} productos por archivo`);

  const optional = (v: string) => (v === "" ? undefined : v);
  // Un texto no numérico pasa tal cual para que el schema responda "debe ser un número".
  const num = (v: string) => {
    const n = Number(semicolon ? v.replace(",", ".") : v);
    return v === "" ? undefined : Number.isNaN(n) ? v : n;
  };

  const products: CreateProductInput[] = [];
  const errors: RowError[] = [];
  const firstRowOfCode = new Map<string, number>();

  rows.forEach((cells, i) => {
    const row = i + 2;
    if (cells.length !== IMPORT_HEADERS.length) {
      errors.push({ row, path: "columns", message: `Se esperaban ${IMPORT_HEADERS.length} columnas y hay ${cells.length}` });
      return;
    }
    const [productCode = "", name = "", category = "", price = "", cost = "", stock = "", minStock = "", provider = ""] = cells;

    const seen = firstRowOfCode.get(productCode);
    if (seen !== undefined) {
      errors.push({ row, path: "productCode", message: `Código repetido en la fila ${seen}` });
      return;
    }
    firstRowOfCode.set(productCode, row);

    const parsed = createProductSchema.safeParse({
      productCode,
      name,
      category: optional(category),
      price: num(price),
      cost: num(cost),
      stock: num(stock),
      minStock: num(minStock),
      provider: optional(provider),
    });
    if (parsed.success) products.push(parsed.data);
    else for (const issue of parsed.error.issues) errors.push({ row, path: issue.path.join("."), message: issue.message });
  });

  return { products, errors };
}

// Todo o nada: con cualquier error no se crea ningún producto.
export async function importProducts(buffer: Buffer, dryRun: boolean) {
  const { products, errors } = parseProductsCsv(buffer);
  if (errors.length) throw new ImportError(400, countMessage(errors.length), errors);

  const codes = products.map((p) => p.productCode);
  const existing = new Set(
    (await prisma.product.findMany({ where: { productCode: { in: codes } }, select: { productCode: true } })).map(
      (p) => p.productCode
    )
  );
  if (existing.size) {
    const rows = codes.flatMap((code, i) =>
      existing.has(code) ? [{ row: i + 2, path: "productCode", message: `El código ${code} ya existe` }] : []
    );
    throw new ImportError(409, countMessage(rows.length), rows);
  }
  if (dryRun) return { dryRun: true, valid: products.length };

  // Mismo caso que el alta: una carrera con otro alta lo decide el índice único.
  await prisma.$transaction((tx) => tx.product.createMany({
      data: products.map(({ minStock, ...p }) => ({
        ...p,
        category: p.category ?? null,
        provider: p.provider ?? null,
        imageUrl: null,
        ...(minStock !== undefined && { minStock }),
      })),
    })).catch((error: any) => {
    throw error?.code === "P2002" ? new ImportError(409, "Algún código ya existe") : error;
  });
  return { created: products.length };
}
