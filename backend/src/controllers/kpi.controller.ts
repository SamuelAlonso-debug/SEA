import { Request, Response } from "express";
import {
  getHeaderKpis,
  getPaymentMethodKpis,
  getLowStockProducts,
  getTopProducts,
  getSummaryKpis,
} from "../services/kpi.service";

export const getHeaderKpisHandler = async (req: Request, res: Response) => {
  try {
    const data = await getHeaderKpis();
    return res.status(200).json(data);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "Error al obtener KPIs del header" });
  }
};

export const getPaymentMethodKpisHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await getPaymentMethodKpis();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Error al obtener KPIs por método de pago",
    });
  }
};

export const getLowStockProductsHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await getLowStockProducts();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Error al obtener productos con stock bajo",
    });
  }
};

export const getTopProductsHandler = async (req: Request, res: Response) => {
  try {
    const data = await getTopProducts();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Error al obtener top productos",
    });
  }
};

export const getSummaryKpisHandler = async (req: Request, res: Response) => {
  try {
    const data = await getSummaryKpis();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Error al obtener resumen de KPIs",
    });
  }
};
