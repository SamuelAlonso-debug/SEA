import { Router } from "express";
import { authMiddleware, requireRole } from "../../shared/auth.middleware";
import {
  getHeaderKpisHandler,
  getPaymentMethodKpisHandler,
  getLowStockProductsHandler,
  getTopProductsHandler,
  getSummaryKpisHandler,
  getProfitKpisHandler,
} from "./kpi.controller";

const router = Router();

// KPIs: solo ADMIN (incluye los que se añadan a este router, p. ej. /profit de #87).
router.use(authMiddleware, requireRole("ADMIN"));

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

// Utilidad del periodo (ventas − costo de lo vendido − gastos)
router.get("/profit", getProfitKpisHandler);

export default router;
