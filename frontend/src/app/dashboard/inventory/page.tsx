"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { productsClient } from "@/lib/products-client";
import type { Product } from "@/types/api";

// Umbral para “bajo stock”, igual que en el backend
const LOW_STOCK_THRESHOLD = 5;

function StatusBadge({
  type,
  children,
}: {
  type: "success" | "danger" | "warning";
  children: React.ReactNode;
}) {
  const colors =
    type === "success"
      ? "text-success"
      : type === "danger"
      ? "text-destructive"
      : "text-[#F5A524]";

  return <span className={`text-xs font-semibold ${colors}`}>{children}</span>;
}

function getStatusFromStock(stock: number): {
  label: string;
  type: "success" | "danger" | "warning";
} {
  if (stock <= 0) return { label: "Sin stock", type: "danger" };
  if (stock <= LOW_STOCK_THRESHOLD) return { label: "Bajo stock", type: "warning" };
  return { label: "En stock", type: "success" };
}

const currency = (v: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(v);

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await productsClient.list();
        setProducts(data);
      } catch (err: any) {
        setError(err.message ?? "Error al cargar inventario");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Solo productos activos (puedes quitar el filtro si quieres ver todos)
  const activeProducts = products.filter((p) => p.isActive);

  const categoriesCount = new Set(
    activeProducts
      .map((p) => p.category)
      .filter((c): c is string => !!c)
  ).size;

  const totalUnits = activeProducts.reduce((sum, p) => sum + p.stock, 0);

  const inventoryCost = activeProducts.reduce(
    (sum, p) => sum + p.stock * p.price,
    0
  );

  const lowStockCount = activeProducts.filter(
    (p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD
  ).length;

  const lastUpdated = (() => {
    if (products.length === 0) return null;
    const latest = products.reduce((latest, p) => {
      const d = new Date(p.updatedAt);
      return d > latest ? d : latest;
    }, new Date(0));
    return latest.getTime() === 0 ? null : latest;
  })();

  const lastUpdatedLabel = lastUpdated
    ? new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(lastUpdated)
    : "Sin registros";

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <section className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-foreground">
            Inventario
          </h1>
          <p className="text-xs text-muted-foreground">
            Última actualización:{" "}
            <span className="font-semibold">{lastUpdatedLabel}</span>
          </p>
          <div className="mt-3 text-sm font-semibold text-primary">
            Inventario
          </div>
        </div>
      </section>

      {/* Tarjetas de resumen */}
      <section className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl bg-card px-5 py-4 shadow-soft">
          <p className="text-xs font-semibold text-muted-foreground">
            Categorías
          </p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-2xl font-extrabold text-foreground">
              {categoriesCount}
            </span>
            <span className="rounded-xl bg-sidebar px-3 py-1 text-xs text-primary font-semibold">
              📦
            </span>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Total de categorías activas
          </p>
        </div>

        <div className="rounded-2xl bg-card px-5 py-4 shadow-soft">
          <p className="text-xs font-semibold text-muted-foreground">
            Total de productos
          </p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-2xl font-extrabold text-foreground">
              {totalUnits}
            </span>
            <span className="rounded-xl bg-sidebar px-3 py-1 text-xs text-primary font-semibold">
              📊
            </span>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Unidades en inventario
          </p>
        </div>

        <div className="rounded-2xl bg-card px-5 py-4 shadow-soft">
          <p className="text-xs font-semibold text-muted-foreground">
            Costo total del inventario
          </p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-2xl font-extrabold text-foreground">
              {currency(inventoryCost)}
            </span>
            <span className="rounded-xl bg-sidebar px-3 py-1 text-xs text-primary font-semibold">
              💰
            </span>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Valor estimado de existencias
          </p>
        </div>

        <div className="rounded-2xl bg-card px-5 py-4 shadow-soft">
          <p className="text-xs font-semibold text-muted-foreground">
            Productos con bajo stock
          </p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-2xl font-extrabold text-foreground">
              {lowStockCount}
            </span>
            <span className="rounded-xl bg-sidebar px-3 py-1 text-xs text-primary font-semibold">
              📋
            </span>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Stock &le; {LOW_STOCK_THRESHOLD} unidades
          </p>
        </div>
      </section>

      {/* Actualizar inventario */}
      <section className="rounded-2xl bg-card px-6 py-4 shadow-soft flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">
            Actualizar Inventario
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Mantén los datos del stock siempre al día.
          </p>
        </div>
        <Link href="/dashboard/inventory/new">
          <Button className="rounded-full bg-accent px-6 text-xs font-semibold text-accent-foreground hover:bg-accent/90">
            Actualizar Inventario
          </Button>
        </Link>
      </section>

      {/* Tabla de stock */}
      <section className="rounded-2xl bg-card px-0 py-4 shadow-soft">
        <div className="px-6 pb-4">
          <h2 className="text-sm font-extrabold text-foreground">
            Stock List
          </h2>
        </div>

        {loading ? (
          <div className="px-6 pb-4 text-[11px] text-muted-foreground">
            Cargando productos...
          </div>
        ) : error ? (
          <div className="px-6 pb-4 text-[11px] text-destructive">
            {error}
          </div>
        ) : activeProducts.length === 0 ? (
          <div className="px-6 pb-4 text-[11px] text-muted-foreground">
            No hay productos activos en el inventario.
          </div>
        ) : (
          <div className="overflow-x-auto px-2">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px] text-muted-foreground">
                  <TableHead className="w-[40px]">No.</TableHead>
                  <TableHead>Imagen</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio c/u</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>En-stock</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeProducts.map((p, index) => {
                  const status = getStatusFromStock(p.stock);
                  return (
                    <TableRow key={p.id} className="text-[11px]">
                      <TableCell className="font-semibold text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </TableCell>
                      <TableCell>
                        <div className="h-10 w-10 rounded-xl bg-muted" />
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {p.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.productCode}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.category ?? "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.stock} pcs
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {currency(p.price)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {currency(p.price * p.stock)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.stock} pcs
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.provider ?? "-"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge type={status.type}>
                          {status.label}
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
