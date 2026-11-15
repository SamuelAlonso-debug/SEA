// src/components/clients/clients-table.tsx

import React from "react";

export type ClientRow = {
  id: string;
  name: string;     // Nombre + apellido
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  isActive: boolean;
};

interface ClientsTableProps {
  clients: ClientRow[];
  onActivate: (id: string) => void;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({ clients, onActivate }) => {
  return (
    <div className="rounded-2xl bg-card px-5 py-4 shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-left text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="pb-2 pr-4 font-semibold">Nombre</th>
              <th className="pb-2 pr-4 font-semibold">Teléfono</th>
              <th className="pb-2 pr-4 font-semibold">Correo</th>
              <th className="pb-2 pr-4 font-semibold">Ciudad</th>
              <th className="pb-2 pr-4 font-semibold">Estado</th>
              <th className="pb-2 pr-4 font-semibold"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-4 text-center text-[11px] text-muted-foreground"
                >
                  No hay clientes registrados aún.
                </td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr
                  key={c.id}
                  className="rounded-xl bg-secondary/40 align-middle text-[11px] text-foreground"
                >
                  <td className="rounded-l-xl px-3 py-2 font-medium">
                    {c.name}
                  </td>
                  <td className="px-3 py-2">{c.phone}</td>
                  <td className="px-3 py-2">{c.email || "-"}</td>
                  <td className="px-3 py-2">{c.city || "-"}</td>
                  <td className="px-3 py-2">{c.state || "-"}</td>
                  <td className="rounded-r-xl px-3 py-2 text-right">
                    {!c.isActive && (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-muted-foreground">Inactivo</span>
                        <button
                          type="button"
                          className="font-semibold text-primary underline hover:text-primary/80"
                          onClick={() => onActivate(c.id)}
                        >
                          Reactivar
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
