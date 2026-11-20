import { Request, Response } from "express";
import { currentDay, currentMonth, percentChange, Period, previousPeriod, Range, rangeOf } from "./business-time";
import { KpiPeriod } from "../modules/kpis/kpi.enums";
import { periodQuerySchema } from "../modules/kpis/kpi.schema";

// Periodo de un ?period= o ?from=&to= ya validado. Sin nada: mes en curso.
export const periodOf = ({ from, to, period }: { from?: string | undefined; to?: string | undefined; period?: string | undefined }): Period =>
  period === KpiPeriod.TODAY ? currentDay() : from && to ? { from, to } : currentMonth();

// Handler de KPI: calcula el periodo pedido y el anterior y devuelve ambos con su variación.
export const comparedKpi =
  <T>(compute: (range: Range) => Promise<T>, change?: (current: T, previous: T) => unknown) =>
  async (req: Request, res: Response) => {
    const period = periodOf(periodQuerySchema.parse(req.query));
    const before = previousPeriod(period);
    const [current, previous] = await Promise.all([compute(rangeOf(period)), compute(rangeOf(before))]);
    return res.status(200).json({ period, previousPeriod: before, current, previous, change: change?.(current, previous) });
  };

// Variación de cada campo numérico, salvo identificadores de periodo y "hoy" (no depende del rango).
const NOT_COMPARED = new Set(["month", "year", "todayRevenue", "todaySalesCount"]);
export const numericChange = <T extends object>(current: T, previous: T) =>
  Object.fromEntries(
    Object.entries(current)
      .filter(([key, value]) => typeof value === "number" && !NOT_COMPARED.has(key))
      .map(([key, value]) => [key, percentChange(value, (previous as Record<string, number>)[key] ?? 0)])
  );
