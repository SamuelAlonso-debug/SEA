import { CaughtError } from "../../shared/caught-error";
import { Request, RequestHandler, Response } from "express";
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesQuerySchema,
  exportCategorySchema,

  expenseKpisQuerySchema,
} from "./expense.schema";
import {
  createExpense,
  deleteExpense,
  getExpenseById,
  listExpenses,
  updateExpense,
  getMonthlyExpenseKpis,
  expenseExportRows,
} from "./expense.service";
import { comparedKpi, numericChange } from "../../shared/period";
import { currentMonth } from "../../shared/business-time";
import { periodQuerySchema } from "../kpis/kpi.schema";
import { csvExport } from "../../shared/csv";
import { z } from "zod";
import { ExpenseCategory } from "@prisma/client";
import { ExpenseListFilters } from "./expense.dto";

export const listExpensesHandler = async (req: Request, res: Response) => {
  try {
    const parsed = listExpensesQuerySchema.parse(req.query);

    const filters: ExpenseListFilters = {
      page: parsed.page,
      pageSize: parsed.pageSize,
    };

    if (parsed.from) {
      filters.from = new Date(parsed.from);
    }

    if (parsed.to) {
      filters.to = new Date(parsed.to);
    }

    if (parsed.category) {
      // Si tu ExpenseCategoryEnum usa los mismos valores que Prisma (service, merchandise, etc)
      filters.category = parsed.category as unknown as ExpenseCategory;
    }

    const result = await listExpenses(filters);
    return res.status(200).json(result);
  } catch (caught) {
    const error = caught as CaughtError;
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Errores de validación",
        errors: error.issues,
      });
    }
    return res
      .status(500)
      .json({ message: error.message || "Error al listar gastos" });
  }
};

export const getExpenseHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({ message: "ID inválido" });
    }

    const expense = await getExpenseById(id);
    return res.status(200).json(expense);
  } catch (caught) {
    const error = caught as CaughtError;
    return res
      .status(404)
      .json({ message: error.message || "Gasto no encontrado" });
  }
};

export const createExpenseHandler = async (req: Request, res: Response) => {
  try {
    const parsed = createExpenseSchema.parse(req.body);

    const expense = await createExpense(parsed);
    return res.status(201).json(expense);
  } catch (caught) {
    const error = caught as CaughtError;
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Errores de validación",
        errors: error.issues,
      });
    }
    return res
      .status(400)
      .json({ message: error.message || "Error al crear gasto" });
  }
};

export const updateExpenseHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({ message: "ID inválido" });
    }

    const parsed = updateExpenseSchema.parse(req.body);

    const expense = await updateExpense(id, parsed);
    return res.status(200).json(expense);
  } catch (caught) {
    const error = caught as CaughtError;
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Errores de validación",
        errors: error.issues,
      });
    }
    return res
      .status(400)
      .json({ message: error.message || "Error al actualizar gasto" });
  }
};

export const deleteExpenseHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({ message: "ID inválido" });
    }

    await deleteExpense(id);
    return res.status(204).send();
  } catch (caught) {
    const error = caught as CaughtError;
    return res
      .status(400)
      .json({ message: error.message || "Error al eliminar gasto" });
  }
};

// Mismo rango que los KPIs (hora del negocio) más ?category=. Sin ?from&to: mes en curso.
export const exportExpensesHandler = csvExport({
  schema: z.intersection(periodQuerySchema, exportCategorySchema),
  filename: (q) => {
    const { from, to } = q.from && q.to ? { from: q.from, to: q.to } : currentMonth();
    return `gastos_${from}_${to}.csv`;
  },
  header: ["Fecha", "Concepto", "Categoría", "Monto", "Método de pago", "Proveedor", "Notas"],
  rows: (q) => expenseExportRows(q.from && q.to ? { from: q.from, to: q.to } : currentMonth(), q.category as ExpenseCategory | undefined),
});

// Mismo 400 que /api/kpis/*: Zod agrupa las claves desconocidas en una issue y la expandimos a una
// por clave (path ["foo"]). Equivalente mínimo al `validated` de kpis (#149); unificar al mergear ambos.
const rejectUnknownQuery: RequestHandler = (req, res, next) => {
  const parsed = expenseKpisQuerySchema.safeParse(req.query);
  if (parsed.success) return next();
  const errors = parsed.error.issues.flatMap((i): { path: PropertyKey[]; message: string }[] =>
    i.code === "unrecognized_keys" ? i.keys.map((key) => ({ ...i, path: [key], message: "Parámetro no permitido" })) : [i]
  );
  return res.status(400).json({ message: "Errores de validación", errors });
};

export const getExpenseKpisHandler: RequestHandler[] = [
  rejectUnknownQuery,
  comparedKpi(getMonthlyExpenseKpis, numericChange, "Error al obtener KPIs de gastos"),
];
