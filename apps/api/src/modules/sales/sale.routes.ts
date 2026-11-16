import { Router } from "express";
import {
  createSaleHandler,
  listSalesHandler,
  getSaleHandler,
  exportSalesHandler,
} from "./sale.controller";
import { authMiddleware } from "../../shared/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", createSaleHandler);
router.get("/", listSalesHandler);
router.get("/export", exportSalesHandler); // antes de /:id
router.get("/:id", getSaleHandler);

export default router;
