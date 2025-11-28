import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SalesPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-foreground">Ventas</h1>
          <p className="text-xs text-muted-foreground">Venta de productos</p>
        </div>
      </section>

      {/* Contenedor principal, centrado y con ancho controlado */}
      <section className="mx-auto w-full max-w-5xl rounded-2xl bg-card shadow-soft px-8 py-6">
        {/* Barra de “busca o escanea un producto” */}
        <div className="mb-6 flex justify-center">
          <div className="w-full max-w-xl rounded-full border border-border bg-muted px-6 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Busca o escanea un producto
          </div>
        </div>

        {/* Grid principal: ticket izquierda, detalle derecha */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Ticket (columna izquierda) */}
          <div className="flex min-h-[320px] flex-col justify-between rounded-2xl border border-[#F5A524] bg-background px-5 py-4">
            <div>
              <h2 className="mb-3 text-sm font-extrabold text-foreground">
                Ticket No. <span className="tracking-[0.35em]">000001</span>
              </h2>

              {/* Lista de productos del ticket */}
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                  📷
                </div>
                <div className="flex-1 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    Nombre del producto
                  </p>
                  <p>Precio</p>
                  <p>Cantidad</p>
                </div>
              </div>

              {/* Placeholder para más items del ticket */}
              <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-[11px] text-muted-foreground">
                Agrega productos al ticket escaneando o buscándolos.
              </div>
            </div>

            {/* Totales */}
            <div className="mt-6 space-y-1 text-xs text-muted-foreground">
              <p>Subtotal: $ 00.00 MXN</p>
              <p>IVA 16%: $ 00.00 MXN</p>
              <p className="pt-2 text-sm font-extrabold text-foreground">
                Total: $ 00.00 MXN
              </p>
            </div>
          </div>

          {/* Detalle del producto + botones (columna derecha) */}
          <div className="flex flex-col gap-4">
            {/* Card de producto */}
            <div className="rounded-2xl border border-border bg-background px-6 py-5">
              <div className="grid grid-cols-[auto,1fr] items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                  📷
                </div>

                <div className="space-y-3">
                  <h2 className="text-sm font-extrabold text-foreground">
                    Nombre del producto
                  </h2>

                  <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 text-xs">
                    <span className="text-muted-foreground">
                      Precio Unitario:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md border border-border bg-card px-3 py-1 text-xs font-semibold">
                        $ 00.00 MXN
                      </span>
                    </div>

                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-semibold text-foreground">0001</span>

                    <span className="text-muted-foreground">Cantidad:</span>
                    <div className="max-w-[120px]">
                      <Input
                        type="number"
                        className="h-7 text-xs"
                        defaultValue={1}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de pago */}
            <div className="flex flex-col gap-3">
              <Button className="h-11 rounded-lg bg-[#17C964] text-xs font-semibold text-white hover:bg-[#14b558]">
                Pago Efectivo
              </Button>
              <Button className="h-11 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                Pago Tarjeta
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
