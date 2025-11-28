"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LabeledInput } from "@/components/forms/labeled-input";
import { LabeledSelect } from "@/components/forms/labeled-select";
import {
  EXPENSE_CATEGORIES,
} from "@/constants/expense-categories";
import { createExpense } from "@/lib/expenses-client";

export default function AddExpensePage() {
  const router = useRouter();

  const [concept, setConcept] = useState("");
  const [category, setCategory] = useState<string>("service");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const amountNumber = parseFloat(amount.replace(",", "."));
      if (isNaN(amountNumber)) {
        throw new Error("El monto no es válido");
      }

      const isoDate = date
        ? new Date(date + "T00:00:00.000Z").toISOString()
        : new Date().toISOString();

      await createExpense({
        concept,
        category: category as any, // cast porque viene de string
        amount: amountNumber,
        date: isoDate,
        paymentMethod,
        vendor: vendor || undefined,
        notes: notes || undefined,
      });

      router.push("/dashboard/expenses");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message ?? "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header sección */}
      <section className="space-y-1">
        <h1 className="text-2xl font-extrabold text-foreground">Gastos</h1>
        <p className="text-xs text-muted-foreground">
          Registra nuevos gastos del negocio.
        </p>
      </section>

      {/* Card principal */}
      <section className="rounded-2xl bg-card px-8 py-6 shadow-soft">
        {/* Regresar */}
        <div className="mb-4">
          <Link
            href="/dashboard/expenses"
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Regresar
          </Link>
        </div>

        {/* Título formulario */}
        <h2 className="text-base font-extrabold text-foreground">
          Agregar nuevo gasto
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Fila 1: Concepto / Categoría */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput
              name="concept"
              label="Concepto del gasto"
              placeholder="Ej. Pago de luz, compra de mercancía..."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
            />

            <LabeledSelect
              name="category"
              label="Categoría"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </LabeledSelect>
          </div>

          {/* Fila 2: Fecha / Monto */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput
              name="date"
              label="Fecha"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <LabeledInput
              name="amount"
              label="Monto"
              placeholder="Ingresa el monto del gasto"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Fila 3: Método de pago / Proveedor */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput
              name="paymentMethod"
              label="Método de pago"
              placeholder="Efectivo, Tarjeta, Transferencia..."
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <LabeledInput
              name="vendor"
              label="Proveedor"
              placeholder="Nombre del proveedor (opcional)"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
          </div>

          {/* Fila 4: Notas */}
          <div className="grid grid-cols-1">
            <LabeledInput
              name="notes"
              label="Notas"
              placeholder="Comentarios adicionales (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {errorMsg && (
            <p className="text-[11px] text-red-500">
              {errorMsg}
            </p>
          )}

          {/* Botón */}
          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#F5A524] px-10 text-xs font-semibold text-white hover:bg-[#f6b341]"
            >
              {submitting ? "Guardando..." : "Agregar gasto"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
