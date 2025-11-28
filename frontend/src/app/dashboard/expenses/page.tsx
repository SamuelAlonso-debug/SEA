"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import {
  ExpensesTable,
  type ExpenseRow,
} from "@/components/expenses/expenses-table";
import {
  getExpenses,
  getExpensesKpis,
  type ExpensesKpisResponse,
  type ExpenseDto,
} from "@/lib/expenses-client";
import { EXPENSE_CATEGORY_LABELS } from "@/constants/expense-categories";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value);

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [kpis, setKpis] = useState<ExpensesKpisResponse | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [errorList, setErrorList] = useState<string | null>(null);
  const [errorKpis, setErrorKpis] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  // Cargar lista de gastos
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        setLoadingList(true);
        setErrorList(null);

        const resp = await getExpenses({
          page,
          pageSize,
        });

        const rows: ExpenseRow[] = resp.data.map((e: ExpenseDto) => ({
          id: e.id,
          date: formatDate(e.date),
          category: EXPENSE_CATEGORY_LABELS[e.category] ?? e.category,
          concept: e.concept,
          paymentMethod: e.paymentMethod,
          amount: e.amount,
        }));

        setExpenses(rows);
        setTotal(resp.total);
      } catch (err: any) {
        setErrorList(err.message ?? "Error al obtener los gastos");
      } finally {
        setLoadingList(false);
      }
    };

    loadExpenses();
  }, [page, pageSize]);

  // Cargar KPIs
  useEffect(() => {
    const loadKpis = async () => {
      try {
        setLoadingKpis(true);
        setErrorKpis(null);

        const data = await getExpensesKpis();
        setKpis(data);
      } catch (err: any) {
        setErrorKpis(err.message ?? "Error al obtener los KPIs de gastos");
      } finally {
        setLoadingKpis(false);
      }
    };

    loadKpis();
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Filtro de búsqueda (client-side sobre la página actual)
  const filteredExpenses = useMemo(() => {
    if (!searchTerm.trim()) return expenses;

    const term = searchTerm.toLowerCase();

    return expenses.filter((e) => {
      return (
        e.concept.toLowerCase().includes(term) ||
        e.category.toLowerCase().includes(term) ||
        e.paymentMethod.toLowerCase().includes(term)
      );
    });
  }, [expenses, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="space-y-1">
        <h1 className="text-2xl font-extrabold text-foreground">Gastos</h1>
        <p className="text-xs text-muted-foreground">
          Visualiza y controla los gastos de tu negocio.
        </p>
      </section>

      {/* KPIs superiores */}
      <section className="grid gap-4 md:grid-cols-2">
        <KpiCard
          title="Gasto total del mes"
          value={
            loadingKpis
              ? "Cargando..."
              : kpis
              ? formatCurrency(kpis.totalAmountMonth)
              : "--"
          }
          
        />
        <KpiCard
          title="Número de gastos"
          value={
            loadingKpis ? "Cargando..." : kpis ? String(kpis.totalCountMonth) : "--"
          }
        
        />
      </section>

      {/* Barra para agregar gasto */}
      <section className="flex items-center justify-between rounded-2xl bg-card px-6 py-4 shadow-soft">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">
            Registrar nuevo gasto
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Agrega gastos como servicios, mercancía, mantenimiento y más.
          </p>
        </div>

        <Link href="/dashboard/expenses/new">
          <Button className="rounded-full bg-[#F5A524] px-6 text-xs font-semibold text-white hover:bg-[#f6b341]">
            Agregar gasto
          </Button>
        </Link>
      </section>

      {/* Tabla de gastos recientes + barra de búsqueda */}
      <section className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-extrabold text-foreground">
            Gastos recientes
          </h2>

          {/* Barra de búsqueda */}
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por concepto, categoría o método de pago"
              className="h-8 w-full rounded-full border border-input bg-background pl-7 pr-3 text-[11px] text-foreground placeholder:text-[11px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {errorList && (
          <p className="text-[11px] text-red-500">
            {errorList}
          </p>
        )}

        {loadingList ? (
          <div className="rounded-2xl bg-card px-5 py-6 text-[11px] text-muted-foreground shadow-soft">
            Cargando gastos...
          </div>
        ) : (
          <ExpensesTable expenses={filteredExpenses} />
        )}

        {/* Paginación */}
        <div className="flex items-center justify-end gap-2 text-[11px]">
          <span className="text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-[11px]"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-[11px]"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      </section>
    </div>
  );
}
