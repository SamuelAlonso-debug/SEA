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

// Valida query, params y body con el schema del endpoint antes del handler. Sin el prefijo "query"
// en los paths, como en los de periodQuerySchema.
const validated =
  (schema: z.ZodType, handler: RequestHandler): RequestHandler =>
  (req, res, next) => {
    const parsed = schema.safeParse({ query: req.query, params: req.params, body: req.body });
    if (!parsed.success) {
      throw new z.ZodError(parsed.error.issues.map((i) => (i.path[0] === "query" ? { ...i, path: i.path.slice(1) } : i)));
    }
    return handler(req, res, next);
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
  comparedKpi(getHeaderKpis, numericChange)
);

export const getPaymentMethodKpisHandler = validated(
  paymentMethodKpisSchema,
  comparedKpi(
    getPaymentMethodKpis,
    changeBy((m) => m.paymentMethod, (m) => m.totalSalesAmount)
  )
);

// Sin variación: el top anterior puede omitir un producto que sí se vendió.
export const getTopProductsHandler = validated(
  topProductsKpisSchema,
  comparedKpi((range) => getTopProducts(range))
);

export const getSummaryKpisHandler = validated(
  summaryKpisSchema,
  comparedKpi(getSummaryKpis, numericChange)
);

export const getProfitKpisHandler = validated(
  profitKpisSchema,
  comparedKpi(getProfitKpis, numericChange)
);

export const getLowStockProductsHandler = validated(lowStockKpisSchema, async (req: Request, res: Response) => {
  return res.status(200).json(await getLowStockProducts());
});

