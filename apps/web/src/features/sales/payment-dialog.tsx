"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { LabeledInput } from "@/components/forms/labeled-input";
import { LabeledSelect } from "@/components/forms/labeled-select";
import { EXPENSE_PAYMENT_METHODS } from "@/features/expenses/expense-categories";
import type { PaymentMethod, SalePaymentInput } from "@/types/api";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Row = { method: PaymentMethod; amount: string; received: string; reference: string };

// Misma regla que la API: todo en centavos enteros.
const toCents = (value: string) => Math.round((Number(value) || 0) * 100);
const money = (cents: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(cents / 100);
const newRow = (method: PaymentMethod, cents: number): Row => ({
  method,
  amount: (cents / 100).toFixed(2),
  received: "",
  reference: "",
});

function rowError(r: Row) {
  if (toCents(r.amount) <= 0) return "El monto del pago debe ser mayor a 0";
  if (r.method === "CASH" && r.received && toCents(r.received) < toCents(r.amount))
    return "El efectivo recibido no cubre el pago";
  return null;
}

interface PaymentDialogProps {
  total: number;
  initialMethod: PaymentMethod;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (payments: SalePaymentInput[]) => void;
}

// Se monta al elegir un método: arranca con un pago por el total y permite dividirlo (pago mixto).
export function PaymentDialog({ total, initialMethod, loading, onCancel, onConfirm }: PaymentDialogProps) {
  const totalCents = Math.round(total * 100);
  const [rows, setRows] = useState<Row[]>([newRow(initialMethod, totalCents)]);
  const update = (index: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const remainingCents = totalCents - rows.reduce((sum, r) => sum + toCents(r.amount), 0);
  const changeCents = rows.reduce(
    (sum, r) => sum + (r.method === "CASH" && r.received ? Math.max(toCents(r.received) - toCents(r.amount), 0) : 0),
    0
  );
  const valid = remainingCents === 0 && rows.every((r) => !rowError(r));

  const handleConfirm = () =>
    onConfirm(
      rows.map((r) => ({
        method: r.method,
        amount: toCents(r.amount) / 100,
        // Solo el efectivo lleva monto recibido; la API rechaza el campo en otros métodos.
        ...(r.method === "CASH" && r.received ? { received: toCents(r.received) / 100 } : {}),
        ...(r.reference.trim() ? { reference: r.reference.trim() } : {}),
      }))
    );

  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar venta</AlertDialogTitle>
          <AlertDialogDescription>
            Total a cobrar: <span className="font-semibold">{money(totalCents)}</span>. Puedes dividirlo entre
            varios métodos.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-[50vh] space-y-3 overflow-y-auto">
          {rows.map((row, i) => {
            const error = rowError(row);
            return (
              <fieldset key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-border p-3">
                <legend className="px-1 text-xs font-semibold text-foreground">Pago {i + 1}</legend>
                <LabeledSelect
                  id={`payment-${i}-method`}
                  label="Método"
                  value={row.method}
                  onChange={(e) => update(i, { method: e.target.value as PaymentMethod, received: "" })}
                >
                  {EXPENSE_PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </LabeledSelect>
                <LabeledInput
                  id={`payment-${i}-amount`}
                  label="Monto"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={row.amount}
                  onChange={(e) => update(i, { amount: e.target.value })}
                  aria-invalid={!!error}
                />
                {row.method === "CASH" ? (
                  <LabeledInput
                    id={`payment-${i}-received`}
                    label="Efectivo recibido"
                    type="number"
                    min={0}
                    step={0.01}
                    value={row.received}
                    onChange={(e) => update(i, { received: e.target.value })}
                    aria-invalid={!!error}
                  />
                ) : (
                  <LabeledInput
                    id={`payment-${i}-reference`}
                    label="Referencia (opcional)"
                    maxLength={100}
                    value={row.reference}
                    onChange={(e) => update(i, { reference: e.target.value })}
                  />
                )}
                {rows.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-auto h-9 text-xs"
                    onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                  >
                    Quitar pago
                  </Button>
                )}
                {error && <p className="col-span-2 text-[11px] font-semibold text-destructive">{error}</p>}
              </fieldset>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-8 text-xs"
          onClick={() => setRows((prev) => [...prev, newRow("CARD", remainingCents)])}
          disabled={remainingCents <= 0}
        >
          Agregar pago
        </Button>

        <div className="space-y-1 text-xs" aria-live="polite">
          {remainingCents !== 0 && (
            <p className="font-semibold text-destructive">
              {remainingCents > 0
                ? `Faltan ${money(remainingCents)} por cubrir`
                : `Los pagos exceden el total por ${money(-remainingCents)}`}
            </p>
          )}
          <p className="text-sm font-extrabold text-foreground">Cambio: {money(changeCents)}</p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <Button type="button" disabled={loading || !valid} onClick={handleConfirm}>
            {loading ? "Guardando..." : "Confirmar venta"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
