import { z } from "zod";
import { periodQuerySchema } from "../../shared/period";

const noParams = z.strictObject({});

// Endpoints por periodo: ?from=&to= (o mes en curso). Sin params ni body.
const periodRequest = z.object({
  query: periodQuerySchema.strict(),
  params: noParams,
  body: noParams.optional(),
});

export const headerKpisSchema = periodRequest;
export const paymentMethodKpisSchema = periodRequest;
export const topProductsKpisSchema = periodRequest;
export const summaryKpisSchema = periodRequest;

// No depende del periodo: no acepta ningún parámetro.
export const lowStockKpisSchema = z.object({
  query: noParams,
  params: noParams,
  body: noParams.optional(),
});

export type HeaderKpisSchemaInput = z.infer<typeof headerKpisSchema>;
export type PaymentMethodKpisSchemaInput = z.infer<typeof paymentMethodKpisSchema>;
export type LowStockKpisSchemaInput = z.infer<typeof lowStockKpisSchema>;
export type TopProductsKpisSchemaInput = z.infer<typeof topProductsKpisSchema>;
export type SummaryKpisSchemaInput = z.infer<typeof summaryKpisSchema>;
