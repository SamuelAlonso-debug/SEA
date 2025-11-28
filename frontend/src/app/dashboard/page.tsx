"use client";

import { useEffect, useState } from "react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { LowStockTable } from "@/components/dashboard/low-stock-table";
import { PaymentMethodsChart } from "@/components/dashboard/payment-methods-chart";
import { SummaryBlock } from "@/components/dashboard/summary-block";
import { TopProductsDonut } from "@/components/dashboard/top-products-donut";

import { kpisClient } from "@/lib/kpis-client";
import { getUser } from "@/lib/auth-client";
import type {
  HeaderKpis,
  PaymentMethodKpi,
  LowStockProduct,
  TopProduct,
  SummaryKpis,
} from "@/types/api";

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
  const [headerKpis, setHeaderKpis] = useState<HeaderKpis | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodKpi[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>(
    []
  );
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [summary, setSummary] = useState<SummaryKpis | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userName, setUserName] = useState("Empresa X");

  // Nombre del usuario logueado
  useEffect(() => {
    const user = getUser();
    if (user) {
      setUserName(`${user.name} ${user.lastname}`);
    }
  }, []);

  // Cargar KPIs
  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const [
          header,
          payment,
          lowStock,
          top,
          summaryData,
        ] = await Promise.all([
          kpisClient.getHeader(),
          kpisClient.getPaymentMethods(),
          kpisClient.getLowStock(),
          kpisClient.getTopProducts(),
          kpisClient.getSummary(),
        ]);

        setHeaderKpis(header);
        setPaymentMethods(payment);
        setLowStockProducts(lowStock);
        setTopProducts(top);
        setSummary(summaryData);
      } catch (err: any) {
        setError(err.message ?? "Error al cargar KPIs");
      } finally {
        setLoading(false);
      }
    };

    fetchKpis();
  }, []);

  const todayLabel = (() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const formatted = formatter.format(now);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  })();

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Cargando panel...
      </div>
    );
  }

  if (error || !headerKpis || !summary) {
    return (
      <div className="p-6 text-sm text-red-500">
        {error ?? "No se pudieron cargar los datos del dashboard."}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      {/* Encabezado */}
      <section className="space-y-1">
        <h1 className="text-2xl font-extrabold text-foreground">
          Bienvenido, {userName} 👋
        </h1>
        <p className="text-xs text-muted-foreground">
          Hoy es {todayLabel}.
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

