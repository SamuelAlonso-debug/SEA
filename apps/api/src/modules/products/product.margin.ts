const round2 = (n: number) => Math.round(n * 100) / 100;

export const PRICE_BELOW_COST = "El precio es menor que el costo";

// Margen sobre el precio de venta (ambos sin IVA). null sin costo capturado o con precio 0.
export function marginOf(price: number, cost: number | null | undefined) {
  if (cost == null) return { margin: null, marginPct: null };
  const margin = round2(price - cost);
  return { margin, marginPct: price > 0 ? round2((margin / price) * 100) : null };
}

// Producto con margen; en alta y edición también avisos (no bloquean).
export function present<T extends { price: number; cost?: number | null }>(p: T, withWarnings = false) {
  const warnings = p.cost != null && p.price < p.cost ? [PRICE_BELOW_COST] : [];
  return { ...p, ...marginOf(p.price, p.cost), ...(withWarnings && { warnings }) };
}
