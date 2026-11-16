import type { Sale } from "@/types/api";

const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
// Hora del negocio, no la del navegador: el ticket debe coincidir con el corte.
const dateFmt = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Mexico_City",
});

// Datos fiscales públicos: se inyectan en el build (NEXT_PUBLIC_*), nunca vienen de la API.
const business = {
  name: process.env.NEXT_PUBLIC_BUSINESS_NAME || "SEA",
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS,
  rfc: process.env.NEXT_PUBLIC_BUSINESS_RFC,
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE,
  footer: process.env.NEXT_PUBLIC_BUSINESS_FOOTER || "¡Gracias por su compra!",
};

const paymentLabel: Record<Sale["paymentMethod"], string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
};

export function Ticket({ sale, width }: { sale: Sale; width: 58 | 80 }) {
  return (
    <>
      {/* Sin margen de página: el ancho lo fija el rollo de la impresora térmica. */}
      <style>{`@page { size: ${width}mm auto; margin: 0 }`}</style>
      <article
        style={{ width: `${width}mm` }}
        className="mx-auto bg-white p-[3mm] font-mono text-[11px] leading-tight text-black print:mx-0 print:p-[2mm]"
      >
        <header className="text-center">
          <h1 className="text-sm font-bold">{business.name}</h1>
          {business.address && <p>{business.address}</p>}
          {business.rfc && <p>RFC: {business.rfc}</p>}
          {business.phone && <p>Tel: {business.phone}</p>}
        </header>

        <hr className="my-2 border-dashed border-black" />
        <p>Ticket No. {sale.ticketNumber}</p>
        <p>{dateFmt.format(new Date(sale.createdAt))}</p>
        {sale.status === "CANCELLED" && (
          <p className="my-2 border-2 border-black py-1 text-center text-sm font-bold">CANCELADA</p>
        )}

        <hr className="my-2 border-dashed border-black" />
        <ul className="space-y-1">
          {sale.items.map((item) => (
            <li key={item.id}>
              <p>{item.productName}</p>
              <p className="flex justify-between">
                <span>
                  {item.quantity} x {money.format(item.unitPrice)}
                </span>
                <span>{money.format(item.subtotal)}</span>
              </p>
            </li>
          ))}
        </ul>

        <hr className="my-2 border-dashed border-black" />
        <dl className="space-y-0.5">
          <Row label="Subtotal" value={money.format(sale.subtotal)} />
          <Row label="IVA 16%" value={money.format(sale.tax)} />
          <Row label="TOTAL" value={money.format(sale.total)} bold />
          <Row label="Pago" value={paymentLabel[sale.paymentMethod]} />
        </dl>

        <p className="mt-3 text-center">{business.footer}</p>
      </article>
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-sm font-bold" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
