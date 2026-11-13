import express, { Request, Response } from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes";
import productRouter from "./routes/product.routes";
import saleRouter from "./routes/sale.routes";
import kpiRouter from "./routes/kpi.routes";
import expenseRouter from "./routes/expense.routes";
import clientRouter from "./routes/client.routes";

const app = express();

// CORS_ORIGIN: lista separada por comas de orígenes permitidos.
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(",");

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Backend funcionando" });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/sales", saleRouter);
app.use("/api/kpis", kpiRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/clients", clientRouter);

export default app;
