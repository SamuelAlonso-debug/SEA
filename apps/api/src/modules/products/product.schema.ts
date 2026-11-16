import { z } from "zod";
import { CreateProductDto, UpdateProductDto } from "./product.dto";
import {
  ProductNameLength,
  ProductCodeLength,
  ProductCategoryLength,
  ProductProviderLength,
  ProductPriceLimits,
  ProductStockLimits,
} from "./product.enums";

export const createProductSchema = z.object({
  name: z
    .string()
    .min(
      ProductNameLength.MIN,
      `El nombre debe tener al menos ${ProductNameLength.MIN} caracteres`
    )
    .max(
      ProductNameLength.MAX,
      `El nombre no puede tener más de ${ProductNameLength.MAX} caracteres`
    ),

  productCode: z
    .string()
    .min(
      ProductCodeLength.MIN,
      `El ID del producto debe tener al menos ${ProductCodeLength.MIN} caracteres`
    )
    .max(
      ProductCodeLength.MAX,
      `El ID del producto no puede tener más de ${ProductCodeLength.MAX} caracteres`
    ),

  category: z
    .string()
    .max(
      ProductCategoryLength.MAX,
      `La categoría no puede tener más de ${ProductCategoryLength.MAX} caracteres`
    )
    .optional()
    .nullable(),

  price: z
    .number({ error: (issue) => (issue.input === undefined ? "El precio es obligatorio" : "El precio debe ser un número") })
    .min(ProductPriceLimits.MIN, "El precio no puede ser negativo")
    .max(ProductPriceLimits.MAX, "El precio es demasiado alto"),

  cost: z
    .number({ error: (issue) => (issue.input === undefined ? "El costo es obligatorio" : "El costo debe ser un número") })
    .min(0, "El costo no puede ser negativo")
    .max(ProductPriceLimits.MAX, "El costo es demasiado alto"),

  stock: z
    .number({ error: (issue) => (issue.input === undefined ? "El stock es obligatorio" : "El stock debe ser un número") })
    .int("El stock debe ser un número entero")
    .min(ProductStockLimits.MIN, "El stock no puede ser negativo")
    .max(ProductStockLimits.MAX, "El stock es demasiado alto"),

  provider: z
    .string()
    .max(
      ProductProviderLength.MAX,
      `El proveedor no puede tener más de ${ProductProviderLength.MAX} caracteres`
    )
    .optional()
    .nullable(),

  imageUrl: z
    .string()
    .url("La URL de la imagen no es válida")
    .optional()
    .nullable(),

  minStock: z
    .number()
    .int("El stock mínimo debe ser un número entero")
    .min(0, "El stock mínimo no puede ser negativo")
    .max(ProductStockLimits.MAX, "El stock mínimo es demasiado alto")
    .optional(),
}) satisfies z.ZodType<CreateProductDto>;

export const updateProductSchema = createProductSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
    // El stock solo cambia con movimientos (entrada, merma, ajuste, venta): así queda registro.
    stock: z.undefined({ error: "El stock se modifica con movimientos" }).optional(),
  }) satisfies z.ZodType<UpdateProductDto>;

const STOCK_QTY_MSG = "La cantidad debe ser un entero mayor a 0";
const REASON_MAX_MSG = "El motivo no puede tener más de 255 caracteres";
const MOVEMENT_QTY_MSG = "La cantidad debe ser un entero distinto de 0";
const REASON_MSG = "El motivo es obligatorio";

export const stockEntrySchema = z.object({
  quantity: z.number(STOCK_QTY_MSG).int(STOCK_QTY_MSG).min(1, STOCK_QTY_MSG),
  reason: z.string().max(255, REASON_MAX_MSG).optional(),
});

// Merma y ajuste manual; entradas, ventas y devoluciones tienen su propio endpoint.
export const stockMovementSchema = z
  .object({
    type: z.enum(["WASTE", "ADJUSTMENT"], {
      error: () => `Opción inválida: se esperaba una de "WASTE"|"ADJUSTMENT"`,
    }),
    quantity: z.number(MOVEMENT_QTY_MSG).int(MOVEMENT_QTY_MSG).refine((n) => n !== 0, MOVEMENT_QTY_MSG),
    reason: z.string(REASON_MSG).trim().min(1, REASON_MSG).max(255, REASON_MAX_MSG),
  })
  .refine((m) => m.type !== "WASTE" || m.quantity < 0, {
    path: ["quantity"],
    message: "Una merma debe ser negativa",
  });

export const movementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "La página debe ser un entero mayor a 0").default(1),
  pageSize: z.coerce.number().int().min(1).max(100, "El tamaño de página máximo es 100").default(20),
});

// Los servicios reciben los DTOs de product.dto; estos tipos son los del controlador.
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type StockEntryInput = z.infer<typeof stockEntrySchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type MovementsQueryInput = z.infer<typeof movementsQuerySchema>;
