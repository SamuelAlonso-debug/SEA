"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Period } from "@/types/api";

const MAX_DAYS = 366;

// Rango de fechas de los KPIs. null = mes en curso (la API decide).
export function RangePicker({ value, onChange }: { value: Period | null; onChange: (p: Period | null) => void }) {
  const [from, setFrom] = useState(value?.from ?? "");
  const [to, setTo] = useState(value?.to ?? "");

  // Mismo límite que la API: evita una respuesta 400 que vacía el panel.
  const days = from && to ? (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1 : 0;
  const tooLong = days > MAX_DAYS;

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    if (from && to && !tooLong) onChange({ from, to });
  };

  const reset = () => {
    setFrom("");
    setTo("");
    onChange(null);
  };

  return (
    <form onSubmit={apply} className="flex flex-wrap items-end gap-2 text-[11px]">
      <label className="flex flex-col gap-1 font-semibold text-muted-foreground">
        Desde
        <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-foreground" />
      </label>
      <label className="flex flex-col gap-1 font-semibold text-muted-foreground">
        Hasta
        <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-foreground" />
      </label>
      <Button type="submit" size="sm" className="h-8 text-[11px]" disabled={!from || !to || tooLong}>
        Aplicar
      </Button>
      {tooLong && <span className="text-destructive">El rango máximo es de {MAX_DAYS} días</span>}
      {value && (
        <Button type="button" variant="ghost" size="sm" className="h-8 text-[11px]" onClick={reset}>
          Mes actual
        </Button>
      )}
    </form>
  );
}

export const periodLabel = (p: Period | null) => (p ? `${p.from} a ${p.to}` : "Mes actual");
