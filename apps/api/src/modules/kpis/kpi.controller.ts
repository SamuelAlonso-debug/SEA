import { Request, Response } from "express";
import {
  getHeaderKpis,
  getPaymentMethodKpis,
  getLowStockProducts,
  getTopProducts,
  getSummaryKpis,
} from "./kpi.service";
import { percentChange } from "../../shared/business-time";
import { comparedKpi, numericChange } from "../../shared/period";

// Variación por elemento de una lista (p. ej. por método de pago o producto).
const changeBy =
  <T>(key: (item: T) => string, value: (item: T) => number) =>
  (current: T[], previous: T[]) =>
    Object.fromEntries(
      current.map((c) => {
        const before = previous.find((p) => key(p) === key(c));
        return [key(c), percentChange(value(c), before ? value(before) : 0)];
      })
    );

export const getHeaderKpisHandler = comparedKpi(getHeaderKpis, numericChange, "Error al obtener KPIs del header");

export const getPaymentMethodKpisHandler = comparedKpi(
  getPaymentMethodKpis,
  changeBy((m) => m.paymentMethod, (m) => m.totalSalesAmount),
  "Error al obtener KPIs por método de pago"
);

export const getTopProductsHandler = comparedKpi(
  (range) => getTopProducts(range),
  changeBy((p) => p.productId, (p) => p.totalQuantity),
  "Error al obtener top productos"
);

export const getSummaryKpisHandler = comparedKpi(getSummaryKpis, numericChange, "Error al obtener resumen de KPIs");

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

