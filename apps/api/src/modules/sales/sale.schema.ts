import { z } from "zod";

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
  paymentMethod: z.enum(["CASH", "CARD"]),
  notes: z.string().max(255, "Notas demasiado largas").optional().nullable(),
  clientId: z.string().regex(/^[a-f\d]{24}$/i, "ID inválido").optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type CreateSaleItemInput = z.infer<typeof saleItemInputSchema>;
