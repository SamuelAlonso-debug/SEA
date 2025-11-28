import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type LowStockProduct = {
  id: string;
  name: string;
  productCode: string;
  stock: number;
};

interface LowStockTableProps {
  items: LowStockProduct[];
}

export function LowStockTable({ items }: LowStockTableProps) {
  const sorted = [...items].sort((a, b) => a.stock - b.stock);

  return (
    <div className="rounded-2xl bg-card px-5 py-3 shadow-soft">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-foreground">
          Productos con stock bajo
        </h2>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-[11px] text-muted-foreground">
              <TableHead className="w-1/4">Código</TableHead>
              <TableHead className="w-2/4">Nombre</TableHead>
              <TableHead className="w-1/4 text-right">Stock actual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((item) => (
              <TableRow
                key={item.id}
                className="border-b border-border/40 text-xs last:border-0"
              >
                <TableCell className="py-2 font-semibold text-foreground">
                  {item.productCode}
                </TableCell>
                <TableCell className="py-2 text-muted-foreground">
                  {item.name}
                </TableCell>
                <TableCell className="py-2 text-right font-semibold text-destructive">
                  {item.stock}
                </TableCell>
              </TableRow>
            ))}

            {sorted.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-6 text-center text-[11px] text-muted-foreground"
                >
                  No hay productos con stock bajo 🎉
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
