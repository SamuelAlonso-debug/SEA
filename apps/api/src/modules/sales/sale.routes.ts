import { Router } from "express";
import {
  createSaleHandler,
  listSalesHandler,
  getSaleHandler,
  exportSalesHandler,
  cancelSaleHandler,
} from "./sale.controller";
import { validateId } from "../../shared/error-handler";
import { authMiddleware, requireRole } from "../../shared/auth.middleware";

const router = Router();

// ADMIN y CASHIER: cobrar y consultar ventas es el trabajo de caja. Exportar y cancelar son de ADMIN.
router.use(authMiddleware);

router.param("id", validateId);

router.post("/", createSaleHandler);
router.get("/", listSalesHandler);
router.get("/export", requireRole("ADMIN"), exportSalesHandler); // antes de /:id
router.get("/:id", getSaleHandler);
// Cancelar reintegra stock y saca la venta de los KPIs.
router.post("/:id/cancel", requireRole("ADMIN"), cancelSaleHandler);

export default router;
