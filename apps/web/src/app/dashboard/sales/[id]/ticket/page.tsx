"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { salesClient } from "@/features/sales/api";
import { Ticket } from "@/features/sales/ticket";
import type { Sale } from "@/types/api";

type State = { kind: "loading" } | { kind: "notFound" } | { kind: "error" } | { kind: "ok"; sale: Sale };

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [width, setWidth] = useState<58 | 80>(80);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    salesClient
      .getById(id)
      .then((sale) => !cancelled && setState({ kind: "ok", sale }))
      .catch((err: unknown) => {
        if (cancelled) return;
        // La API responde 404 (o 400 si el id no es ObjectId) para ventas que no existen.
        const message = err instanceof Error ? err.message : "";
        setState({ kind: /no encontrada|inválido/i.test(message) ? "notFound" : "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  if (state.kind === "loading") return <p className="text-sm text-muted-foreground">Cargando ticket...</p>;

  if (state.kind !== "ok") {
    const notFound = state.kind === "notFound";
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-sm font-semibold">
          {notFound ? "Venta no encontrada" : "No se pudo cargar el ticket. Reintenta."}
        </p>
        <div className="flex gap-2">
          {!notFound && (
            <Button
              variant="outline"
              onClick={() => {
                setState({ kind: "loading" });
                setAttempt((n) => n + 1);
              }}
            >
              Reintentar
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/dashboard/sales">Volver a ventas</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Button onClick={() => window.print()}>Imprimir ticket</Button>
        {([58, 80] as const).map((w) => (
          <Button key={w} variant={width === w ? "default" : "outline"} aria-pressed={width === w} onClick={() => setWidth(w)}>
            {w} mm
          </Button>
        ))}
        <Button asChild variant="outline">
          <Link href="/dashboard/sales">Volver a ventas</Link>
        </Button>
      </div>
      <Ticket sale={state.sale} width={width} />
    </div>
  );
}
