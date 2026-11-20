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
import { comparedKpi, numericChange, periodOf } from "../../shared/period";
import { periodQuerySchema } from "../kpis/kpi.schema";
import { csvExport } from "../../shared/csv";
import { z } from "zod";
import { ExpenseCategory } from "@prisma/client";
import { ExpenseListFilters } from "./expense.dto";

// Sin try/catch: Express 5 lleva los errores (Zod, dominio, BD) al middleware central.
// `req.params.id` llega validado como ObjectId por router.param.

export const listExpensesHandler = async (req: Request, res: Response) => {
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

  return res.status(200).json(await listExpenses(filters));
};

export const getExpenseHandler = async (req: Request, res: Response) => {
  return res.status(200).json(await getExpenseById(req.params.id as string));
};

export const createExpenseHandler = async (req: Request, res: Response) => {
  const parsed = createExpenseSchema.parse(req.body);
  return res.status(201).json(await createExpense(parsed));
};

export const updateExpenseHandler = async (req: Request, res: Response) => {
  const parsed = updateExpenseSchema.parse(req.body);
  return res.status(200).json(await updateExpense(req.params.id as string, parsed));
};

export const deleteExpenseHandler = async (req: Request, res: Response) => {
  await deleteExpense(req.params.id as string);
  return res.status(204).send();
};

// Mismo rango que los KPIs (hora del negocio) más ?category=. Sin ?from&to: mes en curso.
export const exportExpensesHandler = csvExport({
  schema: z.intersection(periodQuerySchema, exportCategorySchema),
  filename: (q) => {
    const { from, to } = periodOf(q);
    return `gastos_${from}_${to}.csv`;
  },
  header: ["Fecha", "Concepto", "Categoría", "Monto", "Método de pago", "Proveedor", "Notas"],
  rows: (q) => expenseExportRows(periodOf(q), q.category as ExpenseCategory | undefined),
});

// ?foo= desconocido → 400 por clave, como /api/kpis/*.
const rejectUnknownQuery: RequestHandler = (req, res, next) => {
  expenseKpisQuerySchema.parse(req.query);
  next();
};

export const getExpenseKpisHandler: RequestHandler[] = [rejectUnknownQuery, comparedKpi(getMonthlyExpenseKpis, numericChange)];
