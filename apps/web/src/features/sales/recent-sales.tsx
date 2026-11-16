"use client";

import { useEffect, useState, type MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { errorMessage } from "@/lib/utils";
import type { Sale } from "@/types/api";
import { salesClient } from "./api";
import { useSession } from "@/features/auth/auth-guard";

const RECENT_LIMIT = 10;

const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });
const dateTime = new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short" });

// `refreshKey` cambia al registrar una venta para que aparezca en la lista.
export function RecentSales({ refreshKey }: { refreshKey: number }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const isAdmin = useSession().user?.role === "ADMIN";
  const [loadError, setLoadError] = useState<string | null>(null);

  const [target, setTarget] = useState<Sale | null>(null);
  const [reason, setReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    salesClient
      .list()
      .then((all) => {
        setSales(all.slice(0, RECENT_LIMIT));
        setLoadError(null);
      })
      .catch((err) => setLoadError(errorMessage(err, "Error al obtener ventas.")));
  }, [refreshKey]);

  const openCancel = (sale: Sale) => {
    setTarget(sale);
    setReason("");
    setCancelError(null);
  };

  const confirmCancel = async (e: MouseEvent) => {
    // El diálogo se queda abierto hasta que la API confirme o devuelva el error.
    e.preventDefault();
    if (!target) return;
    if (!reason.trim()) {
      setCancelError("El motivo es obligatorio");
      return;
    }

    try {
      setCancelling(true);
      const updated = await salesClient.cancel(target.id, reason.trim());
      setSales((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setTarget(null);
    } catch (err) {
      setCancelError(errorMessage(err, "Error al cancelar la venta."));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl rounded-2xl bg-card px-8 py-6 shadow-soft">
      <h2 className="mb-3 text-sm font-extrabold text-foreground">Ventas recientes</h2>

      {loadError && <p className="mb-3 text-[11px] font-semibold text-destructive">{loadError}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-left text-[11px] font-semibold text-muted-foreground">
              <th className="px-3 py-2">Ticket</th>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => {
              const cancelled = sale.status === "CANCELLED";
              return (
                <tr key={sale.id} className="border-t border-border">
                  <td className="px-3 py-2 font-semibold tabular-nums">{sale.ticketNumber}</td>
                  <td className="px-3 py-2 text-muted-foreground">{dateTime.format(new Date(sale.createdAt))}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${cancelled ? "text-muted-foreground line-through" : ""}`}>
                    {currency.format(sale.total)}
                  </td>
                  <td className="px-3 py-2" title={cancelled ? (sale.cancelReason ?? undefined) : undefined}>
                    {cancelled ? <span className="font-semibold text-destructive">Cancelada</span> : "Completada"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {isAdmin && !cancelled && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-7 rounded-full border-destructive text-[11px] font-semibold text-destructive hover:bg-destructive/10"
                        onClick={() => openCancel(sale)}
                        aria-label={`Cancelar venta ${sale.ticketNumber}`}
                      >
                        Cancelar
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}

            {sales.length === 0 && !loadError && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                  Aún no hay ventas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={target !== null} onOpenChange={(open) => !open && !cancelling && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar venta {target?.ticketNumber}</AlertDialogTitle>
            <AlertDialogDescription>
              Se reintegra todo el stock y la venta deja de contar en los indicadores. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Motivo</Label>
            <Input
              id="cancel-reason"
              value={reason}
              maxLength={255}
              onChange={(e) => setReason(e.target.value)}
              disabled={cancelling}
              aria-invalid={cancelError !== null}
              aria-describedby={cancelError ? "cancel-reason-error" : undefined}
            />
            {cancelError && (
              <p id="cancel-reason-error" role="alert" className="text-[11px] font-semibold text-destructive">
                {cancelError}
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Volver</AlertDialogCancel>
            <AlertDialogAction disabled={cancelling} onClick={confirmCancel}>
              {cancelling ? "Cancelando..." : "Cancelar venta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
