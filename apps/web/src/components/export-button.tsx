"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/utils";

// Botón de descarga CSV compartido por ventas, gastos e inventario.
export function ExportButton({ onExport }: { onExport: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await onExport();
    } catch (err) {
      setError(errorMessage(err, "No se pudo exportar"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-[11px]" disabled={busy} onClick={run}>
        <Download className="h-3.5 w-3.5" aria-hidden />
        {busy ? "Exportando…" : "Exportar CSV"}
      </Button>
      {error && (
        <span role="alert" className="text-[11px] text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
