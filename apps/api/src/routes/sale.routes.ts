import { Router } from "express";
import {
  createSaleHandler,
  listSalesHandler,
  getSaleHandler,
} from "../controllers/sale.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", createSaleHandler);
router.get("/", listSalesHandler);
router.get("/:id", getSaleHandler);

export default router;
