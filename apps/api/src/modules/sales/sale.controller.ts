import { AuthRequest } from "../../shared/auth.middleware";
import { Request, Response } from "express";
import { cancelSaleSchema, createSaleSchema } from "./sale.schema";
import { createSale, listSales, getSaleById, cancelSale, saleExportRows } from "./sale.service";
import { csvExport } from "../../shared/csv";
import { periodOf } from "../../shared/period";
import { periodQuerySchema } from "../kpis/kpi.schema";

// Sin try/catch: Express 5 lleva los errores (Zod, dominio, BD) al middleware central.
// `req.params.id` llega validado como ObjectId por router.param.

export const createSaleHandler = async (req: Request, res: Response) => {
  const parsed = createSaleSchema.parse(req.body);
  const sale = await createSale(parsed, (req as AuthRequest).userId);
  return res.status(201).json(sale);
};

export const listSalesHandler = async (req: Request, res: Response) => {
  return res.status(200).json(await listSales());
};

export const getSaleHandler = async (req: Request, res: Response) => {
  return res.status(200).json(await getSaleById(req.params.id as string));
};

// Una fila por ítem. Sin ?from&to: mes en curso, igual que los KPIs.
export const exportSalesHandler = csvExport({
  schema: periodQuerySchema,
  filename: (q) => {
    const { from, to } = periodOf(q);
    return `ventas_${from}_${to}.csv`;
  },
  header: ["Ticket", "Fecha", "Código", "Producto", "Cantidad", "Precio", "Subtotal", "IVA", "Total", "Método de pago", "Cliente", "Cajero"],
  rows: (q) => saleExportRows(periodOf(q)),
});

export const cancelSaleHandler = async (req: Request, res: Response) => {
  const { reason } = cancelSaleSchema.parse(req.body ?? {});
  const sale = await cancelSale(req.params.id as string, reason, (req as AuthRequest).userId);
  return res.status(200).json(sale);
};
