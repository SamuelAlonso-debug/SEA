"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LabeledInput } from "@/components/forms/labeled-input";
import { ProductImageUploadCard } from "@/components/inventory/product-image-upload-card";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value);

export default function AddProductPage() {
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");

  const total = useMemo(() => {
    const priceNum = parseFloat(unitPrice.replace(",", "."));
    const qtyNum = parseFloat(quantity.replace(",", "."));
    if (isNaN(priceNum) || isNaN(qtyNum)) return "";
    const result = priceNum * qtyNum;
    if (isNaN(result)) return "";
    return formatCurrency(result);
  }, [unitPrice, quantity]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header de la sección Inventario */}
      <section className="space-y-1">
        <h1 className="text-2xl font-extrabold text-foreground">Inventario</h1>
        <p className="text-xs text-muted-foreground">
          Agrega nuevos productos al Inventario
        </p>
      </section>

      {/* Card principal del formulario */}
      <section className="rounded-2xl bg-card px-8 py-6 shadow-soft">
        {/* Regresar */}
        <div className="mb-4">
          <Link
            href="/dashboard/inventory" // cambia si tu ruta es /dashboard/inventory
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Regresar
          </Link>
        </div>

        {/* Título del formulario */}
        <h2 className="text-base font-extrabold text-foreground">
          Agregar Nuevo Producto
        </h2>

        {/* Layout principal: foto izquierda, formulario derecha */}
        <div className="mt-6 grid items-start gap-8 lg:grid-cols-3">
          {/* Columna 1: tarjeta de subir foto */}
          <div className="flex justify-center lg:justify-start">
            <ProductImageUploadCard />
          </div>

          {/* Columnas 2 y 3: formulario (ocupa 2/3 de ancho) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Fila 1: Nombre / ID */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <LabeledInput
                name="name"
                label="Nombre del Producto"
                placeholder="Ingresa el Nombre del Producto"
              />
              <LabeledInput
                name="productCode"
                label="ID del Producto"
                placeholder="Ingresa ID"
              />
            </div>

            {/* Fila 2: Categoría / Cantidad adquirida */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <LabeledInput
                name="category"
                label="Categoría"
                placeholder="Ingresa Categoría"
              />
              <LabeledInput
                name="quantity"
                label="Cantidad Adquirida"
                placeholder="Ingresar Cantidad"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                inputMode="decimal"
              />
            </div>

            {/* Fila 3: Precio por unidad / Total */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <LabeledInput
                name="unitPrice"
                label="Precio por Unidad"
                placeholder="Ingresa un Monto"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                inputMode="decimal"
              />

              <div className="flex flex-col gap-1 text-xs">
                <label className="font-semibold text-muted-foreground/90">
                  Total
                </label>
                <input
                  disabled
                  value={total || "Total"}
                  className="h-9 w-full cursor-not-allowed rounded-md border border-input bg-muted text-xs font-semibold text-muted-foreground/90"
                />
              </div>
            </div>

            {/* Fila 4: Proveedor */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <LabeledInput
                name="supplier"
                label="Proveedor"
                placeholder="Ingresa el Nombre del Proveedor"
                className="md:col-span-2"
              />
            </div>

            {/* Botón Agregar Producto */}
            <div className="mt-4 flex justify-end">
              <Button className="rounded-full bg-accent px-10 text-xs font-semibold text-accent-foreground hover:bg-accent/90">
                Agregar Producto
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

