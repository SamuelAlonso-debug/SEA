import { Router } from "express";
import rateLimit from "express-rate-limit";
import { loginHandler, logoutHandler, profileHandler } from "./auth.controller";
import { authMiddleware } from "../../shared/auth.middleware";

const router = Router();

// Frena fuerza bruta de credenciales. Sin registro público: las altas son de un ADMIN (POST /api/users).
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });

router.post("/login", authLimiter, loginHandler);
router.post("/logout", logoutHandler);
router.get("/profile", authMiddleware, profileHandler);

export default router;
