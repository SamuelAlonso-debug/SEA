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
} from "./product.controller";
import { authMiddleware } from "../../shared/auth.middleware";

const router = Router();

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
router.get("/code/:productCode", getProductByCodeHandler);

export default router;
