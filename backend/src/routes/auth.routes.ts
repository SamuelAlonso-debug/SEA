import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  profileHandler,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.get("/profile", authMiddleware, profileHandler);

export default router;
