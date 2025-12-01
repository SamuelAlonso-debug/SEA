// src/app/dashboard/clients/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ClientsTable,
  type ClientRow,
} from "@/components/clients/clients-table";
import {
  getClients,
  type ClientDto,
  type ClientsListResponse,
} from "@/lib/clients-client";

const formatFullName = (c: ClientDto) => `${c.name} ${c.lastname}`;

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [loadingList, setLoadingList] = useState(true);
  const [errorList, setErrorList] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingList(true);
        setErrorList(null);

        const resp: ClientsListResponse = await getClients({
          page,
          pageSize,
          search: searchTerm || undefined,
        });

        const rows: ClientRow[] = resp.data.map((c: ClientDto) => ({
          id: c.id,
          name: formatFullName(c),
          phone: c.phone,
          email: c.email ?? undefined,
          city: c.city ?? undefined,
          state: c.state ?? undefined,
        }));

        setClients(rows);
        setTotal(resp.total);
      } catch (err: any) {
        setErrorList(err.message ?? "Error al obtener los clientes");
      } finally {
        setLoadingList(false);
      }
    };

    loadClients();
    // Nota: si quieres que el search dispare el backend en tiempo real,
    // mete searchTerm en el array de dependencias.
  }, [page, pageSize, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Filtro client-side adicional (sobre la página actual)
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;

    const term = searchTerm.toLowerCase();

    return clients.filter((c) => {
      return (
        c.name.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term) ||
        (c.email ?? "").toLowerCase().includes(term)
      );
    });
  }, [clients, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="space-y-1">
        <h1 className="text-2xl font-extrabold text-foreground">Clientes</h1>
        <p className="text-xs text-muted-foreground">
          Administra y consulta los clientes de tu negocio.
        </p>
      </section>

      {/* Barra para agregar cliente */}
      <section className="flex items-center justify-between rounded-2xl bg-card px-6 py-4 shadow-soft">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">
            Registrar nuevo cliente
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Agrega clientes para poder asociar sus compras y rastrear su historial.
          </p>
        </div>

        <Link href="/dashboard/client/new">
          <Button className="rounded-full bg-[#F5A524] px-6 text-xs font-semibold text-white hover:bg-[#f6b341]">
            Agregar cliente
          </Button>
        </Link>
      </section>

      {/* Tabla + barra de búsqueda */}
      <section className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-extrabold text-foreground">
            Clientes recientes
          </h2>

          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o correo"
              className="h-8 w-full rounded-full border border-input bg-background pl-7 pr-3 text-[11px] text-foreground placeholder:text-[11px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {errorList && (
          <p className="text-[11px] text-red-500">
            {errorList}
          </p>
        )}

        {loadingList ? (
          <div className="rounded-2xl bg-card px-5 py-6 text-[11px] text-muted-foreground shadow-soft">
            Cargando clientes...
          </div>
        ) : (
          <ClientsTable clients={filteredClients} />
        )}

        {/* Paginación */}
        <div className="flex items-center justify-end gap-2 text-[11px]">
          <span className="text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-[11px]"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-[11px]"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      </section>
    </div>
  );
}
