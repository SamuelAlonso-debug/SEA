import { KeyValueTable } from "./key-value-table";

interface SummaryData {
  averageTicketAmount: number;
  averageProductsPerTicket: number;
  todayRevenue: number;
  todaySalesCount: number;
}

interface SummaryBlockProps {
  data: SummaryData;
}

const currency = (v: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(v);

const numberFmt = (v: number) =>
  new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 2,
  }).format(v);

export function SummaryBlock({ data }: SummaryBlockProps) {
  const rows = [
    {
      label: "Ticket promedio",
      value: currency(data.averageTicketAmount),
    },
    {
      label: "Productos por ticket",
      value: numberFmt(data.averageProductsPerTicket),
    },
    {
      label: "Ingresos de hoy",
      value: currency(data.todayRevenue),
    },
    {
      label: "Ventas de hoy",
      value: numberFmt(data.todaySalesCount),
    },
  ];

  return <KeyValueTable title="Resumen" rows={rows} />;
}
