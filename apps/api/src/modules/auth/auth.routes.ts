import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  registerHandler,
  loginHandler,
  profileHandler,
} from "./auth.controller";
import { authMiddleware } from "../../shared/auth.middleware";

const router = Router();

// Frena fuerza bruta de credenciales y altas masivas.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });

router.post("/register", authLimiter, registerHandler);
router.post("/login", authLimiter, loginHandler);
router.get("/profile", authMiddleware, profileHandler);

export default router;
