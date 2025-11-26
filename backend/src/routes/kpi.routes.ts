import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  getHeaderKpisHandler,
  getPaymentMethodKpisHandler,
  getLowStockProductsHandler,
  getTopProductsHandler,
  getSummaryKpisHandler,
} from "../controllers/kpi.controller";

const router = Router();

router.use(authMiddleware);

// Header: transacciones, ventas, tickets, productos vendidos del mes
router.get("/header", getHeaderKpisHandler);

// Gráfico: ingresos por método de pago
router.get("/payment-methods", getPaymentMethodKpisHandler);

// Productos con stock bajo
router.get("/low-stock", getLowStockProductsHandler);

// Top productos vendidos del mes
router.get("/top-products", getTopProductsHandler);

// Ticket promedio, productos por ticket, ingresos de hoy
router.get("/summary", getSummaryKpisHandler);

export default router;
