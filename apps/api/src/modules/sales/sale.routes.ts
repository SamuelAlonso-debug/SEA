import { Router } from "express";
import {
  createSaleHandler,
  listSalesHandler,
  getSaleHandler,
  exportSalesHandler,

  cancelSaleHandler,
} from "./sale.controller";
import { saleIdParamsSchema } from "./sale.schema";
import { authMiddleware } from "../../shared/auth.middleware";

const router = Router();

router.use(authMiddleware);

// Un id que no es ObjectId responde 400 antes de llegar a Prisma.
router.param("id", (req, res, next, id) => {
  if (!saleIdParamsSchema.safeParse({ id }).success) {
    return res.status(400).json({ message: "ID inválido" });
  }
  next();
});

router.post("/", createSaleHandler);
router.get("/", listSalesHandler);
router.get("/export", exportSalesHandler); // antes de /:id
router.get("/:id", getSaleHandler);
// Sin roles todavía (#8): cualquier usuario autenticado puede cancelar.
router.post("/:id/cancel", cancelSaleHandler);

export default router;
