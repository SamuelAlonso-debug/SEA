import { Request, Response } from "express";
import { z } from "zod";
import { currentMonth, percentChange, Period, periodDays, previousPeriod, Range, rangeOf } from "./business-time";

const MAX_DAYS = 366;
const FORMAT = "La fecha debe tener formato AAAA-MM-DD";

const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, FORMAT)
  // Zod 4 sigue con refine aunque falle el regex: fecha inválida no debe lanzar.
  .refine((v) => {
    const date = new Date(`${v}T00:00:00Z`);
    return !isNaN(date.getTime()) && date.toISOString().startsWith(v);
  }, FORMAT);

// ?from=&to= en hora del negocio, inclusivo. Sin ambos: mes en curso.
export const periodQuerySchema = z
  .object({ from: day.optional(), to: day.optional() })
  .superRefine((q, ctx) => {
    if (!q.from !== !q.to) {
      ctx.addIssue({ code: "custom", path: [q.from ? "to" : "from"], message: "Indica fecha inicial y final" });
    } else if (q.from && q.to && q.from > q.to) {
      ctx.addIssue({ code: "custom", path: ["from"], message: "La fecha inicial no puede ser posterior a la final" });
    } else if (q.from && q.to && periodDays({ from: q.from, to: q.to }) > MAX_DAYS) {
      ctx.addIssue({ code: "custom", path: ["to"], message: `El rango máximo es de ${MAX_DAYS} días` });
    }
  });

// Handler de KPI: calcula el periodo pedido y el anterior y devuelve ambos con su variación.
export const comparedKpi =
  <T>(compute: (range: Range) => Promise<T>, change: (current: T, previous: T) => unknown, failMessage: string) =>
  async (req: Request, res: Response) => {
    const parsed = periodQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.issues });
    }
    try {
      const { from, to } = parsed.data;
      const period: Period = from && to ? { from, to } : currentMonth();
      const before = previousPeriod(period);
      const [current, previous] = await Promise.all([compute(rangeOf(period)), compute(rangeOf(before))]);
      return res.status(200).json({ period, previousPeriod: before, current, previous, change: change(current, previous) });
    } catch {
      return res.status(500).json({ message: failMessage });
    }
  };

// Variación de cada campo numérico, salvo identificadores de periodo y "hoy" (no depende del rango).
const NOT_COMPARED = new Set(["month", "year", "todayRevenue", "todaySalesCount"]);
export const numericChange = <T extends object>(current: T, previous: T) =>
  Object.fromEntries(
    Object.entries(current)
      .filter(([key, value]) => typeof value === "number" && !NOT_COMPARED.has(key))
      .map(([key, value]) => [key, percentChange(value, (previous as any)[key] ?? 0)])
  );
