import { Request, Response } from "express";
import { cancelSaleSchema, createSaleSchema } from "./sale.schema";
import { createSale, listSales, getSaleById, cancelSale, SaleError, saleExportRows } from "./sale.service";
import { csvExport } from "../../shared/csv";
import { periodOf } from "../../shared/period";
import { periodQuerySchema } from "../kpis/kpi.schema";

export const createSaleHandler = async (req: Request, res: Response) => {
  try {
    const parsed = createSaleSchema.parse(req.body);

    const userId = (req as any).userId as string | undefined; // depende de tu authMiddleware

    const sale = await createSale(parsed, userId);
    return res.status(201).json(sale);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Datos inválidos",
        errors: error.issues,
      });
    }

    if (error instanceof SaleError) {
      return res.status(error.status).json({ message: error.message });
    }

    return res
      .status(400)
      .json({ message: error.message || "Error al crear la venta" });
  }
};

export const listSalesHandler = async (req: Request, res: Response) => {
  try {
    const sales = await listSales();
    return res.status(200).json(sales);
  } catch {
    return res.status(500).json({ message: "Error al obtener ventas" });
  }
};

export const getSaleHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ message: "El id es requerido" });
    }

    const sale = await getSaleById(id);
    return res.status(200).json(sale);
  } catch (error: any) {
    return res
      .status(404)
      .json({ message: error.message || "Venta no encontrada" });
  }
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
  const parsed = cancelSaleSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]!.message, errors: parsed.error.issues });
  }

  try {
    const userId = (req as any).userId as string | undefined;
    const sale = await cancelSale(req.params.id as string, parsed.data.reason, userId);
    return res.status(200).json(sale);
  } catch (error) {
    if (error instanceof SaleError) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error al cancelar la venta" });
  }
};
