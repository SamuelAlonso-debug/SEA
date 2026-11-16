import { Request, RequestHandler, Response } from "express";
import { z } from "zod";
import {
  getHeaderKpis,
  getPaymentMethodKpis,
  getLowStockProducts,
  getTopProducts,
  getSummaryKpis,
  getProfitKpis,
} from "./kpi.service";
import { percentChange } from "../../shared/business-time";
import { comparedKpi, numericChange } from "../../shared/period";
import { headerKpisSchema, lowStockKpisSchema, paymentMethodKpisSchema, profitKpisSchema, summaryKpisSchema, topProductsKpisSchema } from "./kpi.schema";

// Valida query, params y body con el schema del endpoint antes del handler. Zod agrupa las claves
// desconocidas en una sola issue: la expandimos a una por clave (path ["foo"]) y quitamos el prefijo
// "query", como en los paths de periodQuerySchema.
const validated =
  (schema: z.ZodType, handler: RequestHandler): RequestHandler =>
  (req, res, next) => {
    const parsed = schema.safeParse({ query: req.query, params: req.params, body: req.body });
    if (parsed.success) return handler(req, res, next);
    const errors = parsed.error.issues
      .flatMap((i): { path: PropertyKey[]; message: string }[] =>
        i.code === "unrecognized_keys"
          ? i.keys.map((key) => ({ ...i, path: [...i.path, key], message: "Parámetro no permitido" }))
          : [i]
      )
      .map((i) => (i.path[0] === "query" ? { ...i, path: i.path.slice(1) } : i));
    return res.status(400).json({ message: "Errores de validación", errors });
  };

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

export const getHeaderKpisHandler = validated(
  headerKpisSchema,
  comparedKpi(getHeaderKpis, numericChange, "Error al obtener KPIs del header")
);

export const getPaymentMethodKpisHandler = validated(
  paymentMethodKpisSchema,
  comparedKpi(
    getPaymentMethodKpis,
    changeBy((m) => m.paymentMethod, (m) => m.totalSalesAmount),
    "Error al obtener KPIs por método de pago"
  )
);

// Sin variación: el top anterior puede omitir un producto que sí se vendió.
export const getTopProductsHandler = validated(
  topProductsKpisSchema,
  comparedKpi((range) => getTopProducts(range), undefined, "Error al obtener top productos")
);

export const getSummaryKpisHandler = validated(
  summaryKpisSchema,
  comparedKpi(getSummaryKpis, numericChange, "Error al obtener resumen de KPIs")
);

export const getProfitKpisHandler = validated(
  profitKpisSchema,
  comparedKpi(getProfitKpis, numericChange, "Error al obtener la utilidad")
);

export const getLowStockProductsHandler = validated(lowStockKpisSchema, async (req: Request, res: Response) => {
  try {
    const data = await getLowStockProducts();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Error al obtener productos con stock bajo",
    });
  }
});

