import { Router } from "express";
import { authMiddleware } from "../../shared/auth.middleware";
import { getCatalogsHandler } from "./catalog.controller";

const router = Router();

router.use(authMiddleware);

// GET /api/catalogs
router.get("/", getCatalogsHandler);

export default router;
