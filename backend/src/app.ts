import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routes";
import productRouter from "./routes/product.routes";
import saleRouter from "./routes/sale.routes";
import kpiRouter from "./routes/kpi.routes";
import expenseRouter from "./routes/expense.routes";

dotenv.config();

const app = express();

app.use(cors({
   origin: ["http://localhost:3000"], // frontend
    credentials: true,
}));
app.use(express.json());

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Backend funcionando" });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/sales", saleRouter);
app.use("/api/kpis", kpiRouter);
app.use("/api/expenses", expenseRouter);

export default app;
