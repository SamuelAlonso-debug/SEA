import { z } from "zod";
import {
  ProductNameLength,
  ProductCodeLength,
  ProductCategoryLength,
  ProductProviderLength,
  ProductPriceLimits,
  ProductStockLimits,
} from "../enums/product.enums";

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
    .number()
    .min(ProductPriceLimits.MIN, "El precio no puede ser negativo")
    .max(ProductPriceLimits.MAX, "El precio es demasiado alto"),

  stock: z
    .number()
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
});

export const updateProductSchema = createProductSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

  export const activateProductSchema = z.object({
  params: z.object({
    id: z.string().min(1, "El ID es requerido"),
  }),
});

export type ActivateProductInput = z.infer<typeof activateProductSchema>["params"];
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
