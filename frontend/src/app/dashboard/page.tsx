import { KpiCard } from "@/components/dashboard/kpi-card";
import { LowStockTable } from "@/components/dashboard/low-stock-table";
import { PaymentMethodsChart } from "@/components/dashboard/payment-methods-chart";
import { SummaryBlock } from "@/components/dashboard/summary-block";
import { TopProductsDonut } from "@/components/dashboard/top-products-donut";

// Helpers de formato
const currency = (v: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(v);

const numberFmt = (v: number) =>
  new Intl.NumberFormat("es-MX").format(v);

export default function DashboardHomePage() {
  // 🔹 MOCK DATA – más adelante lo reemplazamos por llamadas al backend
  const headerKpis = {
    month: 10,
    year: 2025,
    totalTransactions: 18,
    totalSalesAmount: 8423.5,
    totalTickets: 18,
    totalProductsSold: 136,
  };

  const paymentMethods = [
    {
      paymentMethod: "CASH",
      totalSalesAmount: 5120.75,
      count: 11,
    },
    {
      paymentMethod: "CARD",
      totalSalesAmount: 3302.75,
      count: 7,
    },
  ];

  const lowStockProducts = [
    {
      id: "692699b49321c248154b5a45",
      name: "Coca Cola 600ml",
      productCode: "COCA-600",
      stock: 3,
    },
    {
      id: "692699b49321c248154b5a46",
      name: "Sabritas Adobadas 45g",
      productCode: "SABRITAS-45",
      stock: 4,
    },
  ];

  const topProducts = [
    {
      productId: "692699b49321c248154b5a45",
      productCode: "COCA-600",
      name: "Coca Cola 600ml",
      totalQuantity: 42,
      totalRevenue: 777.0,
    },
    {
      productId: "692699b49321c248154b5a46",
      productCode: "SABRITAS-45",
      name: "Sabritas Adobadas 45g",
      totalQuantity: 31,
      totalRevenue: 573.5,
    },
    {
      productId: "692699b49321c248154b5a47",
      productCode: "AGUA-1L",
      name: "Agua 1L",
      totalQuantity: 23,
      totalRevenue: 420.0,
    },
  ];

  const summary = {
    month: 10,
    year: 2025,
    averageTicketAmount: 467.97,
    averageProductsPerTicket: 7.56,
    todayRevenue: 1320.5,
    todaySalesCount: 4,
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      {/* Encabezado */}
      <section className="space-y-1">
        <h1 className="text-2xl font-extrabold text-foreground">
          Bienvenido, Empresa X 👋
        </h1>
        <p className="text-xs text-muted-foreground">
          Hoy es Lunes 25 Agosto del 2025.
        </p>
      </section>

      {/* 4 cards superiores */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Ventas totales"
          value={currency(headerKpis.totalSalesAmount)}
          subtitle="Mes actual"
        />
        <KpiCard
          title="Transacciones"
          value={numberFmt(headerKpis.totalTransactions)}
          subtitle="Mes actual"
        />
        <KpiCard
          title="Tickets totales"
          value={numberFmt(headerKpis.totalTickets)}
          subtitle="Mes actual"
        />
        <KpiCard
          title="Productos vendidos"
          value={numberFmt(headerKpis.totalProductsSold)}
          subtitle="Mes actual"
        />
      </section>

      {/* Zona inferior: 4 bloques en 2 columnas */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Izquierda: gráfico + resumen */}
        <div className="space-y-3">
          <PaymentMethodsChart data={paymentMethods} />
          <SummaryBlock
            data={{
              averageTicketAmount: summary.averageTicketAmount,
              averageProductsPerTicket: summary.averageProductsPerTicket,
              todayRevenue: summary.todayRevenue,
              todaySalesCount: summary.todaySalesCount,
            }}
          />
        </div>

        {/* Derecha: stock bajo + top productos */}
        <div className="space-y-3">
          <LowStockTable items={lowStockProducts} />
          <TopProductsDonut data={topProducts} />
        </div>
      </section>
    </div>
  );
}
