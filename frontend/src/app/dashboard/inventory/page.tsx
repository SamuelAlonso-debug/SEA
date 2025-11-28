import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


const stockRows = [
  {
    no: "01",
    img: "/images/stock-1.png",
    name: "Pluma",
    id: "45656787",
    category: "Papelería",
    quantity: "50pcs",
    unitPrice: "$1,000",
    total: "$50,000.00",
    inStock: "40pcs",
    supplier: "Proveedor 1",
    status: "En stock",
    statusType: "success" as const,
  },
  {
    no: "02",
    img: "/images/stock-2.png",
    name: "Papel",
    id: "69956787",
    category: "Papelería",
    quantity: "20pcs",
    unitPrice: "$3,000.00",
    total: "$60,000.00",
    inStock: "0pcs",
    supplier: "Proveedor 2",
    status: "Sin stock",
    statusType: "danger" as const,
  },
  {
    no: "03",
    img: "/images/stock-3.png",
    name: "Jabón líquido",
    id: "36426787",
    category: "Limpieza",
    quantity: "35pcs",
    unitPrice: "$5,000.00",
    total: "$175,000.00",
    inStock: "10pcs",
    supplier: "Proveedor 3",
    status: "Bajo stock",
    statusType: "warning" as const,
  },
  {
    no: "04",
    img: "/images/stock-4.png",
    name: "Clips",
    id: "45656787",
    category: "Papelería",
    quantity: "45pcs",
    unitPrice: "$200.00",
    total: "$9,000.00",
    inStock: "10pcs",
    supplier: "Proveedor 1",
    status: "Bajo stock",
    statusType: "warning" as const,
  },
  {
    no: "05",
    img: "/images/stock-5.png",
    name: "Libretas",
    id: "36426787",
    category: "Papelería",
    quantity: "100pcs",
    unitPrice: "$2,000.00",
    total: "$200,000.00",
    inStock: "45pcs",
    supplier: "Proveedor 1",
    status: "En stock",
    statusType: "success" as const,
  },
];

function StatusBadge({
  type,
  children,
}: {
  type: "success" | "danger" | "warning";
  children: React.ReactNode;
}) {
  const colors =
    type === "success"
      ? "text-success"
      : type === "danger"
      ? "text-destructive"
      : "text-[#F5A524]";

  return <span className={`text-xs font-semibold ${colors}`}>{children}</span>;
}

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <section className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-foreground">
            Inventario
          </h1>
          <p className="text-xs text-muted-foreground">
            Última actualización: <span className="font-semibold">Ayer</span>
          </p>
          <div className="mt-3 text-sm font-semibold text-primary">
            Inventario
          </div>
        </div>
      </section>

      {/* Tarjetas de resumen */}
      <section className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl bg-card px-5 py-4 shadow-soft">
          <p className="text-xs font-semibold text-muted-foreground">
            Categorías
          </p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-2xl font-extrabold text-foreground">15</span>
            <span className="rounded-xl bg-sidebar px-3 py-1 text-xs text-primary font-semibold">
              📦
            </span>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            1% más que el último mes
          </p>
        </div>

        <div className="rounded-2xl bg-card px-5 py-4 shadow-soft">
          <p className="text-xs font-semibold text-muted-foreground">
            Total de productos
          </p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-2xl font-extrabold text-foreground">800</span>
            <span className="rounded-xl bg-sidebar px-3 py-1 text-xs text-primary font-semibold">
              📊
            </span>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            10 más que el mes pasado
          </p>
        </div>

        <div className="rounded-2xl bg-card px-5 py-4 shadow-soft">
          <p className="text-xs font-semibold text-muted-foreground">
            Costo total del inventario
          </p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-2xl font-extrabold text-foreground">
              5,000,000 $
            </span>
            <span className="rounded-xl bg-sidebar px-3 py-1 text-xs text-primary font-semibold">
              💰
            </span>
          </div>
          <p className="mt-3 text-[11px] text-success">
            ↑ 5% Vendido
          </p>
        </div>

        <div className="rounded-2xl bg-card px-5 py-4 shadow-soft">
          <p className="text-xs font-semibold text-muted-foreground">
            Productos con bajo stock
          </p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-2xl font-extrabold text-foreground">200</span>
            <span className="rounded-xl bg-sidebar px-3 py-1 text-xs text-primary font-semibold">
              📋
            </span>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Revisa el inventario
          </p>
        </div>
      </section>

      {/* Actualizar inventario */}
      <section className="rounded-2xl bg-card px-6 py-4 shadow-soft flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">
            Actualizar Inventario
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Mantén los datos del stock siempre al día.
          </p>
        </div>
        <Link href="/dashboard/inventory/new">
        <Button className="rounded-full bg-accent px-6 text-xs font-semibold text-accent-foreground hover:bg-accent/90">
          Actualizar Inventario
        </Button>
        </Link>
      </section>

      {/* Tabla de stock */}
      <section className="rounded-2xl bg-card px-0 py-4 shadow-soft">
        <div className="px-6 pb-4">
          <h2 className="text-sm font-extrabold text-foreground">
            Stock List
          </h2>
        </div>
        <div className="overflow-x-auto px-2">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px] text-muted-foreground">
                <TableHead className="w-[40px]">No.</TableHead>
                <TableHead>Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio c/u</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>En-stock</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockRows.map((row) => (
                <TableRow key={row.no} className="text-[11px]">
                  <TableCell className="font-semibold text-muted-foreground">
                    {row.no}
                  </TableCell>
                  <TableCell>
                    <div className="h-10 w-10 rounded-xl bg-muted" />
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {row.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.id}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.category}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.quantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.unitPrice}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.total}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.inStock}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.supplier}
                  </TableCell>
                  <TableCell>
                    <StatusBadge type={row.statusType}>
                      {row.status}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
