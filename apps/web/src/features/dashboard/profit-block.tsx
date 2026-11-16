import type { ProfitKpis } from "@/types/api";
import { KeyValueTable } from "./key-value-table";

const currency = (v: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(v);

export function ProfitBlock({ data }: { data: ProfitKpis }) {
  const rows = [
    { label: "Ventas netas (sin IVA)", value: currency(data.netSales) },
    { label: "Costo de lo vendido", value: currency(data.costOfGoodsSold) },
    { label: "Utilidad bruta", value: currency(data.grossProfit) },
    { label: "Gastos (sin mercancía)", value: currency(data.expenses) },
    { label: "Utilidad neta", value: currency(data.netProfit) },
    { label: "Margen", value: data.marginPct == null ? "—" : `${data.marginPct} %` },
  ];

  return (
    <div className="space-y-1">
      <KeyValueTable title="Utilidad" rows={rows} />
      {data.warnings.map((w) => (
        <p key={w} className="px-5 text-[11px] font-semibold text-destructive">
          {w} ({data.itemsWithoutCost})
        </p>
      ))}
    </div>
  );
}
