import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type KeyValueRow = {
  label: string;
  value: string;
};

interface KeyValueTableProps {
  title: string;
  rows: KeyValueRow[];
}

export function KeyValueTable({ title, rows }: KeyValueTableProps) {
  return (
    <div className="rounded-2xl bg-card px-5 py-3 shadow-soft">
      <h2 className="mb-2 text-sm font-extrabold text-foreground">{title}</h2>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-[11px] text-muted-foreground">
              <TableHead className="w-1/2">Concepto</TableHead>
              <TableHead className="w-1/2 text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label} className="text-xs">
                <TableCell className="py-2 text-muted-foreground">
                  {row.label}
                </TableCell>
                <TableCell className="py-2 text-right font-semibold text-foreground">
                  {row.value}
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="py-6 text-center text-[11px] text-muted-foreground"
                >
                  Sin información disponible.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
