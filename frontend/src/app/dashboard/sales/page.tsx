"use client";

import { useState, KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { salesClient } from "@/lib/sales-client";
import { productsClient } from "@/lib/products-client";
import type { Sale, PaymentMethod } from "@/types/api";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value);

type TicketItem = {
  productCode: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

type DetailItem = {
  name: string;
  code: string;
  unitPrice: number;
  quantity: number;
};

export default function SalesPage() {
  const [productCode, setProductCode] = useState("");
  const [quantity, setQuantity] = useState<string>("1");

  const [ticketNumber, setTicketNumber] = useState("0000000");

  const [items, setItems] = useState<TicketItem[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const [sale, setSale] = useState<Sale | null>(null);

  const [loadingScan, setLoadingScan] = useState(false);
  const [loadingSale, setLoadingSale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<PaymentMethod | null>(
    null
  );

  // --------- Detalle que se muestra en la tarjeta derecha ----------
  const detailItem: DetailItem | null = (() => {
    // 1) Si ya hay venta confirmada, mostramos lo que regresó el backend
    if (sale && sale.items.length > 0) {
      const i = sale.items[0];
      return {
        name: i.productName,
        code: i.productCode,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      };
    }

    // 2) Si el usuario está escribiendo un código nuevo,
    //    la tarjeta refleja en tiempo real ese código y cantidad
    const trimmedCode = productCode.trim().toUpperCase();
    if (trimmedCode) {
      const qty = parseInt(quantity || "0", 10) || 0;
      return {
        name: "Nombre del producto",
        code: trimmedCode,
        unitPrice: 0,
        quantity: qty,
      };
    }

    // 3) Si no hay nada escrito y hay productos en el ticket,
    //    mostramos el último (o el seleccionado)
    if (items.length === 0) return null;

    let target = items[items.length - 1];
    if (selectedCode) {
      const found = items.find((i) => i.productCode === selectedCode);
      if (found) target = found;
    }

    return {
      name: target.name,
      code: target.productCode,
      unitPrice: target.unitPrice,
      quantity: target.quantity,
    };
  })();

  // --------- Totales (borrador vs venta confirmada) ----------
  const draftSubtotal = items.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity * 0.84,
    0
  );
  const draftTax = draftSubtotal * 0.16;

  const subtotal = sale ? sale.subtotal : draftSubtotal;
  const tax = sale ? sale.tax : draftTax;
  const total = sale ? sale.total : subtotal;

  const subtotalLabel = formatCurrency(subtotal || 0);
  const taxLabel = formatCurrency(tax || 0);
  const totalLabel = formatCurrency(total || 0);

  const currentTicketNumber = ticketNumber;

  // --------- ENTER: agregar producto al ticket ----------
  const handleScanEnter = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const rawCode = productCode.trim();
    const code = rawCode.toUpperCase();

    // empezamos un armado de ticket nuevo (no venta ya guardada)
    setError(null);
    setSale(null);

    if (!code) {
      setError("Ingresa el ID del producto.");
      return;
    }

    const qty = parseInt(quantity || "0", 10);
    if (isNaN(qty) || qty <= 0) {
      setError("Ingresa una cantidad válida.");
      return;
    }

    try {
      setLoadingScan(true);

      const product = await productsClient.getByCode(code);

      if (!product || !product.isActive) {
        setError("Producto no encontrado o inactivo.");
        return;
      }

      // Si el producto ya está en el ticket, solo sumamos cantidad
      setItems((prev) => {
        const idx = prev.findIndex((p) => p.productCode === product.productCode);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            quantity: copy[idx].quantity + qty,
          };
          return copy;
        }

        return [
          ...prev,
          {
            productCode: product.productCode,
            name: product.name,
            unitPrice: product.price,
            quantity: qty,
          },
        ];
      });

      setSelectedCode(product.productCode);

      // Calcular ticket si es el primero
      if (ticketNumber === "0000000") {
        const sales = await salesClient.list();
        const lastTicket = sales[0]?.ticketNumber ?? "0000000";
        const lastNumeric = parseInt(lastTicket, 10) || 0;
        const nextTicket = (lastNumeric + 1).toString().padStart(7, "0");
        setTicketNumber(nextTicket);
      }

      // dejamos listo para escanear el siguiente producto
      setProductCode("");
      setQuantity("1");
    } catch (err: any) {
      setError(err.message ?? "Error al buscar el producto.");
    } finally {
      setLoadingScan(false);
    }
  };

  // --------- Abrir modal de confirmación ----------
  const handleOpenConfirm = (method: PaymentMethod) => {
    setError(null);

    if (items.length === 0) {
      setError("Agrega al menos un producto al ticket antes de registrar la venta.");
      return;
    }

    setPendingMethod(method);
    setConfirmOpen(true);
  };

  // --------- Confirmar venta (llamar API) ----------
  const handleConfirmSale = async () => {
    if (!pendingMethod) return;

    try {
      setLoadingSale(true);
      setError(null);

      // Creamos la venta en el backend con todos los productos del ticket
      await salesClient.create({
        paymentMethod: pendingMethod,
        items: items.map((i) => ({
          productCode: i.productCode,
          quantity: i.quantity,
        })),
        notes: null,
      });

      // ✅ Después de registrar la venta, limpiamos el ticket COMPLETO
      handleCancelTicket();
    } catch (err: any) {
      setError(err.message ?? "Error al registrar la venta.");
    } finally {
      setLoadingSale(false);
      setConfirmOpen(false);
      setPendingMethod(null);
    }
  };

  // --------- Cancelar ticket (limpieza total) ----------
  const handleCancelTicket = () => {
    setProductCode("");
    setQuantity("1");
    setItems([]);
    setSale(null);
    setSelectedCode(null);
    setTicketNumber("0000000");
    setError(null);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <section className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-foreground">Ventas</h1>
            <p className="text-xs text-muted-foreground">Venta de productos</p>
          </div>
        </section>

        {/* Contenedor principal */}
        <section className="mx-auto w-full max-w-5xl rounded-2xl bg-card shadow-soft px-8 py-6">
          {/* Input principal (scan/búsqueda) */}
          <div className="mb-6 flex justify-center">
            <input
              type="text"
              placeholder="Busca o escanea un producto"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              onKeyDown={handleScanEnter}
              className="
                w-full max-w-xl rounded-full border border-border 
                bg-muted px-6 py-2 text-center text-xs font-semibold 
                text-muted-foreground uppercase tracking-wide
                focus:outline-none focus:ring-2 focus:ring-primary
              "
              disabled={loadingScan || loadingSale}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 text-[11px] font-semibold text-destructive text-center">
              {error}
            </div>
          )}

          {/* Grid principal */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Ticket */}
            <div className="flex min-h-[320px] flex-col justify-between rounded-2xl border border-[#F5A524] bg-background px-5 py-4">
              <div>
                <h2 className="mb-3 text-sm font-extrabold text-foreground">
                  Ticket No.{" "}
                  <span className="tracking-[0.35em]">
                    {currentTicketNumber}
                  </span>
                </h2>

                {/* Lista de productos del ticket */}
                {items.length > 0 ? (
                  <div className="mb-5 space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.productCode}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                          📷
                        </div>
                        <div className="flex-1 text-xs text-muted-foreground">
                          <p className="font-semibold text-foreground">
                            {item.name}
                          </p>
                          <p>Precio: {formatCurrency(item.unitPrice)}</p>
                          <p>Cantidad: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-5 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-[11px] text-muted-foreground">
                    Agrega productos al ticket escaneando o buscándolos.
                  </div>
                )}

                {items.length > 0 && (
                  <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-center text-[11px] text-muted-foreground">
                    Revisa los datos y confirma la venta.
                  </div>
                )}
              </div>

              {/* Totales + cancelar */}
              <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                <p>Subtotal: {subtotalLabel}</p>
                <p>IVA 16%: {taxLabel}</p>
                <p className="pt-1 text-sm font-extrabold text-foreground">
                  Total: {totalLabel}
                </p>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 rounded-full border-destructive text-[11px] font-semibold text-destructive hover:bg-destructive/10"
                    onClick={handleCancelTicket}
                    disabled={loadingScan || loadingSale}
                  >
                    Cancelar ticket
                  </Button>
                </div>
              </div>
            </div>

            {/* Detalle del producto (tarjeta derecha) */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-border bg-background px-6 py-5">
                <div className="grid grid-cols-[auto,1fr] items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                    📷
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-sm font-extrabold text-foreground">
                      {detailItem ? detailItem.name : "Nombre del producto"}
                    </h2>

                    <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 text-xs">
                      <span className="text-muted-foreground">
                        Precio Unitario:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-border bg-card px-3 py-1 text-xs font-semibold">
                          {detailItem && detailItem.unitPrice
                            ? formatCurrency(detailItem.unitPrice)
                            : "$ 00.00 MXN"}
                        </span>
                      </div>

                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-semibold text-foreground">
                        {detailItem?.code ||
                          productCode.trim().toUpperCase() ||
                          "—"}
                      </span>

                      <span className="text-muted-foreground">Cantidad:</span>
                      <div className="max-w-[120px]">
                        <Input
                          type="number"
                          className="h-7 text-xs"
                          value={quantity}
                          min={1}
                          onChange={(e) => setQuantity(e.target.value)}
                          disabled={loadingScan || loadingSale}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de pago */}
              <div className="flex flex-col gap-3">
                <Button
                  className="h-11 rounded-lg bg-[#17C964] text-xs font-semibold text-white hover:bg-[#14b558]"
                  onClick={() => handleOpenConfirm("CASH")}
                  disabled={loadingScan || loadingSale || items.length === 0}
                >
                  Pago Efectivo
                </Button>
                <Button
                  className="h-11 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleOpenConfirm("CARD")}
                  disabled={loadingScan || loadingSale || items.length === 0}
                >
                  Pago Tarjeta
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Ventana emergente de confirmación */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar venta</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Deseas registrar esta venta{" "}
              {pendingMethod === "CASH" ? "en efectivo" : "con tarjeta"} por un
              total de{" "}
              <span className="font-semibold">
                {totalLabel}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingSale}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={loadingSale}
              onClick={handleConfirmSale}
            >
              {loadingSale ? "Guardando..." : "Confirmar venta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
