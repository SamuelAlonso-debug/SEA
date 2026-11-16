import { z } from "zod";
import { PaymentMethod } from "@prisma/client";
import { toCents } from "./sale.payments";

const PAYMENT_METHODS = Object.values(PaymentMethod);

export const salePaymentInputSchema = z
  .object({
    method: z.enum(PaymentMethod, {
      error: () => `Opción inválida: se esperaba una de ${PAYMENT_METHODS.map((m) => `"${m}"`).join("|")}`,
    }),
    amount: z.number().positive("El monto del pago debe ser mayor a 0"),
    received: z.number().optional(),
    reference: z.string().trim().max(100, "Referencia demasiado larga").optional(),
  })
  .superRefine((p, ctx) => {
    if (p.received === undefined) return;
    if (p.method !== "CASH") {
      ctx.addIssue({ code: "custom", path: ["received"], message: "Solo los pagos en efectivo llevan monto recibido" });
    } else if (toCents(p.received) < toCents(p.amount)) {
      ctx.addIssue({ code: "custom", path: ["received"], message: "El efectivo recibido no cubre el pago" });
    }
  });

export const saleItemInputSchema = z.object({
  productCode: z.string().min(1, "El productCode es obligatorio"),
  quantity: z
    .number()
    .int("La cantidad debe ser entera")
    .min(1, "La cantidad mínima es 1"),
});

export const createSaleSchema = z.object({
  items: z
    .array(saleItemInputSchema)
    .min(1, "Debe haber al menos un producto en la venta"),
  // La suma contra el total se valida en el servicio: el total sale de los precios vigentes.
  payments: z.array(salePaymentInputSchema).min(1, "Debe haber al menos un pago"),
  notes: z.string().max(255, "Notas demasiado largas").optional().nullable(),
  clientId: z.string().regex(/^[a-f\d]{24}$/i, "ID inválido").optional(),
});

export const saleIdParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "ID inválido"),
});

export const cancelSaleSchema = z.object({
  reason: z
    .string({ error: "El motivo es obligatorio" })
    .trim()
    .min(1, "El motivo es obligatorio")
    .max(255, "El motivo no puede tener más de 255 caracteres"),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type SalePaymentInput = z.infer<typeof salePaymentInputSchema>;
export type CreateSaleItemInput = z.infer<typeof saleItemInputSchema>;
