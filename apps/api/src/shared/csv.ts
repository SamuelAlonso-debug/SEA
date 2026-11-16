import { Request, RequestHandler, Response } from "express";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { z } from "zod";

export type Cell = string | number | null | undefined;

// Excel interpreta como fórmula lo que empieza con = + - @ (y tab/CR): se antepone ' para que sea texto.
// Solo aplica a texto: los números negativos no pasan por aquí.
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(cell: Cell): string {
  if (cell === null || cell === undefined) return "";
  let text = String(cell);
  if (typeof cell === "string" && FORMULA_START.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// CRLF como pide RFC 4180 y espera Excel.
export const csvRow = (cells: Cell[]) => cells.map(csvCell).join(",") + "\r\n";

// Lee de Mongo por páginas con cursor: la memoria no crece con el total de filas.
export async function* paged<T extends { id: string }>(
  find: (page: { take: number; cursor?: { id: string }; skip?: number }) => Promise<T[]>,
  size = 500
): AsyncGenerator<T> {
  let cursor: string | undefined;
  for (;;) {
    const rows = await find(cursor ? { take: size, cursor: { id: cursor }, skip: 1 } : { take: size });
    yield* rows;
    if (rows.length < size) return;
    cursor = rows[rows.length - 1]!.id;
  }
}

// Endpoint de exportación: valida la query antes de enviar nada y luego transmite el CSV por chunks.
// BOM UTF-8 al inicio para que Excel respete los acentos.
export function csvExport<Q>(opts: {
  schema: z.ZodType<Q>;
  filename: (query: Q) => string;
  header: string[];
  rows: (query: Q) => AsyncIterable<Cell[]>;
}): RequestHandler {
  return async (req: Request, res: Response) => {
    const parsed = opts.schema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Errores de validación", errors: parsed.error.issues });
    }
    const query = parsed.data;
    async function* chunks() {
      yield "﻿" + csvRow(opts.header);
      for await (const row of opts.rows(query)) yield csvRow(row);
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${opts.filename(query)}"`);
    try {
      await pipeline(Readable.from(chunks()), res);
    } catch {
      // Con la respuesta ya empezada no se puede cambiar el estado: se corta la conexión.
      if (!res.headersSent) {
        res.removeHeader("Content-Disposition");
        res.status(500).json({ message: "Error al exportar" });
      } else {
        res.destroy();
      }
    }
  };
}
