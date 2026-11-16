import { Router } from "express";
import { authMiddleware, requireRole } from "../../shared/auth.middleware";
import { createUserHandler, listUsersHandler } from "./user.controller";

const router = Router();

// Solo un ADMIN da de alta personal: no hay registro público.
router.use(authMiddleware, requireRole("ADMIN"));

router.get("/", listUsersHandler);
router.post("/", createUserHandler);

export default router;
