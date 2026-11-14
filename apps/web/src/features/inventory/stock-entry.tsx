"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/utils";
import { productsClient } from "@/features/inventory/api";
import type { Product } from "@/types/api";

// Entrada de stock en la fila: suma unidades sin pasar por el alta del producto.
export function StockEntry({ product, onDone }: { product: Product; onDone: (p: Product) => void }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setOpen(true)}>
        Entrada de stock
      </Button>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setSaving(true);
      onDone(await productsClient.addStock(product.id, Number(quantity)));
      setOpen(false);
      setQuantity("");
    } catch (err) {
      setError(errorMessage(err, "Error al registrar la entrada"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <input
          aria-label={`Unidades a sumar a ${product.name}`}
          inputMode="numeric"
          autoFocus
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="h-7 w-16 rounded-md border border-input bg-background px-2 text-[11px]"
        />
        <Button type="submit" size="sm" className="h-7 text-[11px]" disabled={saving || !quantity}>
          {saving ? "..." : "Sumar"}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </form>
  );
}
