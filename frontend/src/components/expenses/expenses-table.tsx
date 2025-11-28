"use client";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

export type ExpenseRow = {
  id: string;
  date: string;          // Fecha formateada
  category: string;      // En español ("Servicios", "Mercancía", etc.)
  concept: string;
  paymentMethod: string;
  amount: number;
};

interface ExpensesTableProps {
  expenses: ExpenseRow[];
}

export function ExpensesTable({ expenses }: ExpensesTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-xs">
          <thead className="bg-muted/60">
            <tr className="text-left text-[11px] font-semibold text-muted-foreground">
              <th className="rounded-tl-2xl px-5 py-3">Fecha</th>
              <th className="px-3 py-3">Categoría</th>
              <th className="px-3 py-3">Concepto</th>
              <th className="px-3 py-3">Método de pago</th>
              <th className="rounded-tr-2xl px-5 py-3 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense, index) => (
              <tr
                key={expense.id}
                className={index % 2 === 0 ? "bg-card" : "bg-muted/40"}
              >
                <td className="px-5 py-3 text-[11px] text-muted-foreground">
                  {expense.date}
                </td>
                <td className="px-3 py-3 text-[11px] font-semibold text-foreground">
                  {expense.category}
                </td>
                <td className="px-3 py-3 text-[11px] text-muted-foreground">
                  {expense.concept}
                </td>
                <td className="px-3 py-3 text-[11px] text-muted-foreground">
                  {expense.paymentMethod}
                </td>
                <td className="px-5 py-3 text-right text-[11px] font-semibold text-[#ED3237]">
                  {currencyFormatter.format(expense.amount)}
                </td>
              </tr>
            ))}

            {expenses.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-6 text-center text-[11px] text-muted-foreground"
                >
                  No hay gastos registrados aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
