import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRouter from "./modules/auth/auth.routes";
import productRouter from "./modules/products/product.routes";
import saleRouter from "./modules/sales/sale.routes";
import kpiRouter from "./modules/kpis/kpi.routes";
import expenseRouter from "./modules/expenses/expense.routes";
import clientRouter from "./modules/clients/client.routes";
import prisma from "./shared/prisma";

const app = express();

// CORS_ORIGIN: lista separada por comas de orígenes permitidos.
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(",");

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
// Límite global holgado: el dashboard dispara varias peticiones por vista.
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: "draft-8", legacyHeaders: false }));
app.use(express.json({ limit: "100kb" }));

// Liveness: el proceso vive. No toca la BD.
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Backend funcionando" });
});

// Readiness: la BD responde en 2 s. Sin detalles del error en la respuesta.
const READY_TIMEOUT_MS = 2000;
app.get("/api/health/ready", async (req: Request, res: Response) => {
  const timeout = new Promise((_, reject) => setTimeout(reject, READY_TIMEOUT_MS).unref());
  try {
    await Promise.race([prisma.$runCommandRaw({ ping: 1 }), timeout]);
    res.json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/sales", saleRouter);
app.use("/api/kpis", kpiRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/clients", clientRouter);

export default app;
