"use client";

import { errorMessage } from "@/lib/utils";
import { useEffect, useState } from "react";

import { KpiCard } from "@/features/dashboard/kpi-card";
import { LowStockTable } from "@/features/dashboard/low-stock-table";
import { PaymentMethodsChart } from "@/features/dashboard/payment-methods-chart";
import { SummaryBlock } from "@/features/dashboard/summary-block";
import { ProfitBlock } from "@/features/dashboard/profit-block";
import { TopProductsDonut } from "@/features/dashboard/top-products-donut";
import { RangePicker, periodLabel } from "@/features/dashboard/range-picker";

import { kpisClient } from "@/features/dashboard/api";
import { useSession } from "@/features/auth/auth-guard";
import type {
  HeaderKpis,
  PaymentMethodKpi,
  LowStockProduct,
  TopProduct,
  SummaryKpis,
  ProfitKpis,
  PeriodQuery,
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
  const [profit, setProfit] = useState<ProfitKpis | null>(null);
  const [period, setPeriod] = useState<PeriodQuery | null>(null);
  // Periodo de los datos en pantalla; distinto de `period` mientras se recarga.
  const [loadedPeriod, setLoadedPeriod] = useState<PeriodQuery | null | undefined>(undefined);
  const refreshing = loadedPeriod !== period;
  const [headerChange, setHeaderChange] = useState<Record<string, number | null>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useSession();
  const userName = user ? `${user.name} ${user.lastname}` : "Empresa X";

  // Cargar KPIs. Una respuesta tardía de un periodo ya cambiado se descarta.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      kpisClient.getHeader(period),
      kpisClient.getPaymentMethods(period),
      kpisClient.getLowStock(),
      kpisClient.getTopProducts(period),
      kpisClient.getSummary(period),
      kpisClient.getProfit(period),
    ])
      .then(([header, payment, lowStock, top, summaryData, profitData]) => {
        if (cancelled) return;
        setHeaderKpis(header.current);
        setHeaderChange(header.change);
        setPaymentMethods(payment.current);
        setLowStockProducts(lowStock);
        setTopProducts(top.current);
        setSummary(summaryData.current);
        setProfit(profitData.current);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Error al cargar KPIs"));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadedPeriod(period);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

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

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      {/* Encabezado: el selector sigue visible aunque falle la carga */}
      <section className="space-y-1">
        <h1 className="text-2xl font-extrabold text-foreground">
          Bienvenido, {userName} 👋
        </h1>
        <p className="text-xs text-muted-foreground">
          Hoy es {todayLabel}.
        </p>
        <RangePicker value={period} onChange={setPeriod} />
        {refreshing && (
          <p role="status" className="text-[11px] text-muted-foreground">
            Actualizando…
          </p>
        )}
      </section>

      {error || !headerKpis || !summary || !profit ? (
        <div role="alert" className="p-6 text-sm text-red-500">
          {error ?? "No se pudieron cargar los datos del dashboard."}
        </div>
      ) : (
        <div className={`flex flex-col gap-5 ${refreshing ? "opacity-60" : ""}`}>
          {/* 4 cards superiores */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Ventas totales"
              value={currency(headerKpis.totalSalesAmount)}
              subtitle={periodLabel(period)}
              change={headerChange.totalSalesAmount}
            />
            <KpiCard
              title="Transacciones"
              value={numberFmt(headerKpis.totalTransactions)}
              subtitle={periodLabel(period)}
              change={headerChange.totalTransactions}
            />
            <KpiCard
              title="Tickets totales"
              value={numberFmt(headerKpis.totalTickets)}
              subtitle={periodLabel(period)}
              change={headerChange.totalTickets}
            />
            <KpiCard
              title="Productos vendidos"
              value={numberFmt(headerKpis.totalProductsSold)}
              subtitle={periodLabel(period)}
              change={headerChange.totalProductsSold}
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
              <ProfitBlock data={profit} />
            </div>

            {/* Derecha: stock bajo + top productos */}
            <div className="space-y-3">
              <LowStockTable items={lowStockProducts} />
              <TopProductsDonut data={topProducts} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
