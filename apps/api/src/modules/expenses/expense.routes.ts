import { Router } from "express";
import { authMiddleware } from "../../shared/auth.middleware";
import {
  listExpensesHandler,
  getExpenseHandler,
  createExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
  getExpenseKpisHandler,
} from "./expense.controller";

const router = Router();

// proteger todas con auth
router.use(authMiddleware);

// /api/expenses
router.get("/kpis", getExpenseKpisHandler);
router.get("/", listExpensesHandler);             // ?from=&to=&category=&page=&pageSize=
router.get("/:id", getExpenseHandler);
router.post("/", createExpenseHandler);
router.put("/:id", updateExpenseHandler);
router.delete("/:id", deleteExpenseHandler);

export default router;
