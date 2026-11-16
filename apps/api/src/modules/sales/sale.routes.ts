import { Router } from "express";
import {
  createSaleHandler,
  listSalesHandler,
  getSaleHandler,
} from "./sale.controller";
import { authMiddleware } from "../../shared/auth.middleware";

const router = Router();

// ADMIN y CASHIER: cobrar y consultar ventas es el trabajo de caja.
router.use(authMiddleware);

router.post("/", createSaleHandler);
router.get("/", listSalesHandler);
router.get("/:id", getSaleHandler);

export default router;
