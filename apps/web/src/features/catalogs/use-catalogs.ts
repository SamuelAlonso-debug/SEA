"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { getToken } from "@/features/auth/api";
import type { CatalogsResponse } from "@/types/api";

// Una sola petición por sesión de página, compartida por todos los componentes.
// Si falla se descarta para reintentar en el siguiente montaje.
let pending: Promise<CatalogsResponse> | null = null;

function loadCatalogs() {
  pending ??= apiClient
    .get<CatalogsResponse>("/catalogs", { token: getToken() })
    .catch((err) => {
      pending = null;
      throw err;
    });
  return pending;
}

const EMPTY: CatalogsResponse = { expenseCategories: [], paymentMethods: [] };

export function useCatalogs() {
  const [catalogs, setCatalogs] = useState<CatalogsResponse>(EMPTY);

  useEffect(() => {
    let active = true;
    loadCatalogs()
      .then((data) => active && setCatalogs(data))
      .catch(() => {}); // sin catálogo se muestra el valor crudo
    return () => {
      active = false;
    };
  }, []);

  const labelOf = (options: { value: string; label: string }[]) => (value: string) =>
    options.find((o) => o.value === value)?.label ?? value;

  return {
    ...catalogs,
    categoryLabel: labelOf(catalogs.expenseCategories),
    paymentMethodLabel: labelOf(catalogs.paymentMethods),
  };
}
