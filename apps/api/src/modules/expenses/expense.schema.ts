// src/schemas/expense.schema.ts

import { z } from "zod";
import { ExpenseCategoryEnum } from "./expense.enums";

// Mismo catálogo que ventas (enum PaymentMethod de Prisma).
export const PAYMENT_METHODS = ["CASH", "CARD", "TRANSFER"] as const;

export const createExpenseSchema = z.object({
  concept: z
    .string()
    .min(1, "El concepto es obligatorio")
    .max(200, "El concepto es demasiado largo"),

  // Aquí solo se permite { message?, error? }
  category: z.nativeEnum(ExpenseCategoryEnum, {
    message: "La categoría es obligatoria",
  }),

  amount: z
    .number({
      // En tu versión de Zod solo existe `message`
      message: "El monto debe ser numérico",
    })
    .positive("El monto debe ser mayor a 0"),

  date: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.date().optional()),

  paymentMethod: z.enum(PAYMENT_METHODS, {
    error: (issue) =>
      issue.input === undefined
        ? "El método de pago es obligatorio"
        : `Opción inválida: se esperaba una de ${PAYMENT_METHODS.map((m) => `"${m}"`).join("|")}`,
  }),
  vendor: z.string().max(150).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

// Filtros para listar
export const listExpensesQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  category: z.nativeEnum(ExpenseCategoryEnum).optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10)),
});
