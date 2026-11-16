import { z } from "zod";
import { PaymentMethod } from "@prisma/client";
import { ExpenseCategoryEnum } from "./expense.enums";
import { periodQuerySchema } from "../kpis/kpi.schema";

// Mismo catálogo que ventas: el enum de Prisma es la única fuente.
export const PAYMENT_METHODS = Object.values(PaymentMethod);

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

  paymentMethod: z.enum(PaymentMethod, {
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

// ?category= de la exportación: mismo formato de "opción inválida" que el método de pago.
const CATEGORIES = Object.values(ExpenseCategoryEnum);
export const exportCategorySchema = z.object({
  category: z
    .enum(ExpenseCategoryEnum, {
      error: () => `Opción inválida: se esperaba una de ${CATEGORIES.map((c) => `"${c}"`).join("|")}`,
    })
    .optional(),
});

// /kpis solo acepta el periodo (?from=&to=); cualquier otra clave se rechaza.
export const expenseKpisQuerySchema = periodQuerySchema.strict();
