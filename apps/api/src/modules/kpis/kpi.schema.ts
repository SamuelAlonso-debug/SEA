import { z } from "zod";
import { periodDays } from "../../shared/business-time";
import { KpiPeriod } from "./kpi.enums";

const MAX_DAYS = 366;
const FORMAT = "La fecha debe tener formato AAAA-MM-DD";
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// Un solo check: formato y fecha real, una sola issue por campo.
const day = z.string().refine((v) => {
  if (!DAY_RE.test(v)) return false;
  const date = new Date(`${v}T00:00:00Z`);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(v);
}, FORMAT);

// ?period=TODAY|MONTH o ?from=&to= (excluyentes) en hora del negocio, inclusivo. Sin nada: mes en curso.
export const periodQuerySchema = z
  .object({
    period: z.enum(KpiPeriod, { error: () => `Opción inválida: se esperaba una de ${Object.values(KpiPeriod).map((p) => `"${p}"`).join(" o ")}` }).optional(),
    from: day.optional(),
    to: day.optional(),
  })
  .superRefine((q, ctx) => {
    if (q.period && (q.from || q.to)) {
      ctx.addIssue({ code: "custom", path: ["period"], message: "Indica periodo o rango, no ambos" });
      return;
    }
    // Formato inválido: ya tiene su issue; comparar texto libre añadiría otra.
    if ((q.from && !DAY_RE.test(q.from)) || (q.to && !DAY_RE.test(q.to))) return;
    if (!q.from !== !q.to) {
      ctx.addIssue({ code: "custom", path: [q.from ? "to" : "from"], message: "Indica fecha inicial y final" });
    } else if (q.from && q.to && q.from > q.to) {
      ctx.addIssue({ code: "custom", path: ["from"], message: "La fecha inicial no puede ser posterior a la final" });
    } else if (q.from && q.to && periodDays({ from: q.from, to: q.to }) > MAX_DAYS) {
      ctx.addIssue({ code: "custom", path: ["to"], message: `El rango máximo es de ${MAX_DAYS} días` });
    }
  });

/**
 * Por ahora, los endpoints de KPIs no reciben body ni params.
 * Dejamos los schemas preparados por si luego queremos aceptar month/year por query.
 */

export const headerKpisSchema = z.object({
  query: z
    .object({
      // opcionalmente, podrías permitir ?month=0-11&year=2025
      month: z.string().optional(),
      year: z.string().optional(),
    })
    .optional(),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const paymentMethodKpisSchema = z.object({
  query: z.object({}).optional(),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const lowStockKpisSchema = z.object({
  query: z.object({}).optional(),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const topProductsKpisSchema = z.object({
  query: z.object({}).optional(),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const summaryKpisSchema = z.object({
  query: z.object({}).optional(),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export type HeaderKpisSchemaInput = z.infer<typeof headerKpisSchema>;
export type PaymentMethodKpisSchemaInput = z.infer<typeof paymentMethodKpisSchema>;
export type LowStockKpisSchemaInput = z.infer<typeof lowStockKpisSchema>;
export type TopProductsKpisSchemaInput = z.infer<typeof topProductsKpisSchema>;
export type SummaryKpisSchemaInput = z.infer<typeof summaryKpisSchema>;
