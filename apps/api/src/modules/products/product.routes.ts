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
  exportProductsHandler,

  importProductsHandler,
  importTemplateHandler,
  createMovementHandler,
  listMovementsHandler,
} from "./product.controller";
import { authMiddleware, requireRole } from "../../shared/auth.middleware";
import { validateId } from "../../shared/error-handler";

const router = Router();

router.param("id", validateId);

// Todas protegidas. CASHIER solo consulta; altas, cambios, stock, importación y exportación son de ADMIN.
router.use(authMiddleware);
const adminOnly = requireRole("ADMIN");

router.get("/", listProductsHandler);
router.get("/export", adminOnly, exportProductsHandler); // antes de /:id
router.get("/import/template", adminOnly, importTemplateHandler);
router.post("/import", adminOnly, importProductsHandler);
router.get("/:id", getProductHandler);
router.post("/", adminOnly, createProductHandler);
router.put("/:id", adminOnly, updateProductHandler);
router.delete("/:id", adminOnly, deleteProductHandler);
router.patch("/:id/activate", adminOnly, activateProductHandler);
router.post("/:id/stock", adminOnly, addStockHandler);
router.get("/:id/movements", listMovementsHandler);
router.post("/:id/movements", adminOnly, createMovementHandler);
router.get("/code/:productCode", getProductByCodeHandler);

export default router;
