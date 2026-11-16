import { Request, RequestHandler, Response } from "express";
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesQuerySchema,
  expenseKpisQuerySchema,
} from "./expense.schema";
import {
  createExpense,
  deleteExpense,
  getExpenseById,
  listExpenses,
  updateExpense,
  getMonthlyExpenseKpis,
} from "./expense.service";
import { comparedKpi, numericChange } from "../../shared/period";
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
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error: any) {
    return res
      .status(400)
      .json({ message: error.message || "Error al eliminar gasto" });
  }
};

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
