"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PaymentMethodKpi = {
  paymentMethod: string;
  totalSalesAmount: number;
  count: number;
};

interface PaymentMethodsChartProps {
  data: PaymentMethodKpi[];
}

const COLORS: Record<string, string> = {
  CASH: "#17C964", // Efectivo
  CARD: "#1A2D4D", // Tarjeta
};

export function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
  const formatted = data.map((item) => ({
    ...item,
    label:
      item.paymentMethod === "CASH"
        ? "Efectivo"
        : item.paymentMethod === "CARD"
        ? "Tarjeta"
        : item.paymentMethod,
  }));

  return (
    <div className="rounded-2xl bg-card px-5 py-3 shadow-soft">
      <h2 className="mb-2 text-sm font-extrabold text-foreground">
        Ingresos por método de pago (mes actual)
      </h2>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formatted}>
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) =>
                new Intl.NumberFormat("es-MX", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(v as number)
              }
            />
            <Tooltip
              formatter={(value, _name, entry) => [
                new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                  minimumFractionDigits: 2,
                }).format(value as number),
                `Ingresos (${entry?.payload?.count ?? 0} ventas)`,
              ]}
            />
            <Bar dataKey="totalSalesAmount" radius={[8, 8, 0, 0]}>
              {formatted.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.paymentMethod] ?? "#1A2D4D"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
