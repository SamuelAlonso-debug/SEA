"use client";

import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

type TopProduct = {
  productId: string;
  productCode: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
};

interface TopProductsDonutProps {
  data: TopProduct[];
}

const COLORS = ["#17C964", "#F5A524", "#ED3237", "#1A2D4D"];

export function TopProductsDonut({ data }: TopProductsDonutProps) {
  const total = data.reduce((sum, item) => sum + item.totalQuantity, 0);

  return (
    <div className="flex flex-col rounded-2xl bg-card px-5 py-3 shadow-soft">
      <h2 className="mb-2 text-sm font-extrabold text-foreground">
        Ventas por producto
      </h2>

      <div className="flex gap-4 min-h-[160px]">
        {/* Lista */}
        <div className="flex min-w-[130px] flex-col justify-center gap-1 text-xs">
          <p className="mb-1 text-[11px] font-semibold text-muted-foreground">
            Top más vendidos
          </p>
          {data.map((item, index) => (
            <div key={item.productId} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="font-semibold text-foreground">
                {item.totalQuantity}
              </span>
              <span className="text-muted-foreground">
                {item.name ?? item.productCode}
              </span>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-[11px] text-muted-foreground">
              Sin datos de ventas por ahora.
            </p>
          )}
        </div>

        {/* Dona */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={(value, _name, entry) => [
                  `${value} unidades`,
                  entry.payload.name ?? entry.payload.productCode,
                ]}
              />
              <Pie
                data={data}
                dataKey="totalQuantity"
                nameKey="name"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {total > 0 && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          Total unidades vendidas en top:{" "}
          <span className="font-semibold text-foreground">{total}</span>
        </p>
      )}
    </div>
  );
}
