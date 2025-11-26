import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routes";
import productRouter from "./routes/product.routes";
import saleRouter from "./routes/sale.routes";
import kpiRouter from "./routes/kpi.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Backend funcionando 🚀" });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);

app.use("/api/sales", saleRouter);

app.use("/api/kpis", kpiRouter);

export default app;
