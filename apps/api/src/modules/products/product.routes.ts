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
  importProductsHandler,
  importTemplateHandler,
  createMovementHandler,
  listMovementsHandler,
} from "./product.controller";
import { authMiddleware } from "../../shared/auth.middleware";
import { validateId } from "../../shared/error-handler";

const router = Router();

router.param("id", validateId);

// Todas las rutas protegidas
router.use(authMiddleware);

router.get("/", listProductsHandler);
router.get("/import/template", importTemplateHandler);
router.post("/import", importProductsHandler);
router.get("/:id", getProductHandler);
router.post("/", createProductHandler);
router.put("/:id", updateProductHandler);
router.delete("/:id", deleteProductHandler);
router.patch("/:id/activate", activateProductHandler);
router.post("/:id/stock", addStockHandler);
router.get("/:id/movements", listMovementsHandler);
router.post("/:id/movements", createMovementHandler);
router.get("/code/:productCode", getProductByCodeHandler);

export default router;
