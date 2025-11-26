// src/schemas/kpi.schema.ts
import { z } from "zod";

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
