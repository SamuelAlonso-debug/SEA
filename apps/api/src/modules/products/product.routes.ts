import { Router } from "express";
import {
  createProductHandler,
  listProductsHandler,
  getProductHandler,
  updateProductHandler,
  deleteProductHandler,
  activateProductHandler,
  getProductByCodeHandler,
  addStockHandler,
} from "./product.controller";
import { authMiddleware, requireRole } from "../../shared/auth.middleware";

const router = Router();

// Todas protegidas. CASHIER solo consulta; altas, cambios y stock son de ADMIN.
router.use(authMiddleware);
const adminOnly = requireRole("ADMIN");

router.get("/", listProductsHandler);
router.get("/:id", getProductHandler);
router.post("/", adminOnly, createProductHandler);
router.put("/:id", adminOnly, updateProductHandler);
router.delete("/:id", adminOnly, deleteProductHandler);
router.patch("/:id/activate", adminOnly, activateProductHandler);
router.post("/:id/stock", adminOnly, addStockHandler);
router.get("/code/:productCode", getProductByCodeHandler);

export default router;
