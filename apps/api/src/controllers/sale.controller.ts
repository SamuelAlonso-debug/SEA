import { Request, Response } from "express";
import { createSaleSchema } from "../schemas/sale.schema";
import { createSale, listSales, getSaleById } from "../services/sale.service";

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
        errors: error.errors,
      });
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
