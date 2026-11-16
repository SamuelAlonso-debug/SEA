"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { LabeledInput } from "@/components/forms/labeled-input";
import { LabeledSelect } from "@/components/forms/labeled-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorMessage } from "@/lib/utils";
import { productsClient } from "@/features/inventory/api";
import type { Product, StockMovementsResponse, StockMovementType } from "@/types/api";

const TYPE_LABEL: Record<StockMovementType, string> = {
  SALE: "Venta",
  REFUND: "Devolución",
  PURCHASE: "Entrada",
  WASTE: "Merma",
  ADJUSTMENT: "Ajuste",
};

const QTY_MSG = "La cantidad debe ser un entero distinto de 0";
// Mismas reglas que `stockMovementSchema` en la API, que ante un 400 solo devuelve "Datos inválidos".
const movementSchema = z
  .object({
    type: z.enum(["WASTE", "ADJUSTMENT"]),
    quantity: z.coerce.number(QTY_MSG).int(QTY_MSG).refine((n) => n !== 0, QTY_MSG),
    reason: z.string().trim().min(1, "El motivo es obligatorio").max(255, "El motivo no puede tener más de 255 caracteres"),
  })
  .refine((m) => m.type !== "WASTE" || m.quantity < 0, { path: ["quantity"], message: "Una merma debe ser negativa" });

const EMPTY_FORM = { type: "WASTE", quantity: "", reason: "" };
const dateTime = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });

// Historial de stock de un producto y alta de merma o ajuste. onChange recibe el producto con su stock nuevo;
// sin onChange (CASHIER) solo se muestra el historial.
export function StockMovements({
  product,
  onChange,
  onClose,
}: {
  product: Product;
  onChange?: (p: Product) => void;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<StockMovementsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // product.stock en las dependencias: tras una merma, ajuste o entrada se recarga el historial.
  useEffect(() => {
    let active = true;
    productsClient
      .movements(product.id, page)
      .then((r) => {
        if (!active) return;
        setLoadError(null);
        setResult(r);
      })
      .catch((err) => active && setLoadError(errorMessage(err, "Error al cargar los movimientos")));
    return () => {
      active = false;
    };
  }, [product.id, product.stock, page]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = movementSchema.safeParse(form);
    if (!parsed.success) return setFormError(parsed.error.issues[0].message);
    try {
      setSaving(true);
      onChange?.(await productsClient.addMovement(product.id, parsed.data));
      setForm(EMPTY_FORM);
      setPage(1);
    } catch (err) {
      setFormError(errorMessage(err, "Error al registrar el movimiento"));
    } finally {
      setSaving(false);
    }
  };

  const pages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <section aria-label={`Movimientos de ${product.name}`} className="rounded-2xl bg-card px-6 py-4 shadow-soft">
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-sm font-extrabold text-foreground">
          Movimientos de {product.name} · stock {product.stock}
        </h2>
        <Button variant="ghost" size="sm" className="text-[11px]" onClick={onClose}>
          Cerrar
        </Button>
      </div>

      {onChange && (
        <form onSubmit={submit} className="grid grid-cols-[10rem_8rem_1fr_auto] items-end gap-3 pb-4">
          <LabeledSelect
            label="Tipo"
            id="movement-type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="WASTE">Merma</option>
            <option value="ADJUSTMENT">Ajuste</option>
          </LabeledSelect>
          <LabeledInput
            label="Cantidad (+/−)"
            id="movement-quantity"
            inputMode="numeric"
            placeholder="-1"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <LabeledInput
            label="Motivo"
            id="movement-reason"
            maxLength={255}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
          <Button type="submit" size="sm" className="h-9 text-xs" disabled={saving}>
            {saving ? "Guardando..." : "Registrar"}
          </Button>
        </form>
      )}
      {formError && <p role="alert" className="pb-3 text-[11px] text-destructive">{formError}</p>}

      {loadError ? (
        <p className="text-[11px] text-destructive">{loadError}</p>
      ) : !result ? (
        <p className="text-[11px] text-muted-foreground">Cargando movimientos...</p>
      ) : result.data.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">Sin movimientos registrados.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="text-[11px] text-muted-foreground">
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Stock resultante</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((m) => (
                <TableRow key={m.id} className="text-[11px]">
                  <TableCell>{dateTime.format(new Date(m.createdAt))}</TableCell>
                  <TableCell>{TYPE_LABEL[m.type]}</TableCell>
                  <TableCell className={m.quantity < 0 ? "text-destructive" : "text-success"}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </TableCell>
                  <TableCell>{m.stockAfter}</TableCell>
                  <TableCell>{m.reason ?? "-"}</TableCell>
                  <TableCell>{m.userName ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-end gap-2 pt-3 text-[11px] text-muted-foreground">
            <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Anterior
            </Button>
            <span>
              Página {page} de {pages}
            </span>
            <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              Siguiente
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
