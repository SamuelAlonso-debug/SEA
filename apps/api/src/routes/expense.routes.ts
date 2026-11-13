// src/routes/expense.routes.ts

import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  listExpensesHandler,
  getExpenseHandler,
  createExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
  getExpenseKpisHandler,
} from "../controllers/expense.controller";

const router = Router();

// proteger todas con auth
router.use(authMiddleware);

// /api/expenses
router.get("/kpis", getExpenseKpisHandler); 
router.get("/", listExpensesHandler);             // ?from=&to=&category=&page=&pageSize=
router.get("/kpis/month", getExpenseKpisHandler); // KPIs mes actual
router.get("/:id", getExpenseHandler);
router.post("/", createExpenseHandler);
router.put("/:id", updateExpenseHandler);
router.delete("/:id", deleteExpenseHandler);

export default router;
