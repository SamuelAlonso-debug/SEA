const IVA_RATE = 0.16;

export interface TotalsLine {
  unitPrice: number;
  quantity: number;
}

// Se calcula en centavos enteros para evitar residuos de coma flotante. `price` es sin IVA.
export function computeTotals(lines: TotalsLine[]) {
  const subtotal = lines.reduce((sum, l) => sum + Math.round(l.unitPrice * 100) * l.quantity, 0);
  const tax = Math.round(subtotal * IVA_RATE);
  return { subtotal: subtotal / 100, tax: tax / 100, total: (subtotal + tax) / 100 };
}
