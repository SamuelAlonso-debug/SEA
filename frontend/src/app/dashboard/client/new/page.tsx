// src/app/dashboard/clients/new/page.tsx
"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/clients-client";

export default function NewClientPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    lastname: "",
    phone: "",
    email: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.lastname || !form.phone) {
      setError("Nombre, apellido y teléfono son obligatorios.");
      return;
    }

    try {
      setSubmitting(true);

      await createClient({
        name: form.name,
        lastname: form.lastname,
        phone: form.phone,
        email: form.email || undefined,
        street: form.street || undefined,
        neighborhood: form.neighborhood || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
      });

      router.push("/dashboard/client");
    } catch (err: any) {
      setError(err.message ?? "Error al crear el cliente");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header simple con botón regresar opcional si ya lo tienes en layout */}
      <section className="space-y-1">
        <h1 className="text-2xl font-extrabold text-foreground">
          Agregar nuevo cliente
        </h1>
        <p className="text-xs text-muted-foreground">
          Captura los datos del cliente para poder asociar sus compras.
        </p>

      </section>
      

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-card px-6 py-6 shadow-soft space-y-4"
      >
      {/* Regresar */}
        <div className="mb-4">
          <Link
            href="/dashboard/client"
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Regresar
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Nombre */}
          <div className="space-y-1">
            <Label htmlFor="name" className="text-[11px] font-semibold">
              Nombre *
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Ingresa el nombre"
              value={form.name}
              onChange={handleChange}
              required
              className="h-9 text-[11px]"
            />
          </div>

          {/* Apellido */}
          <div className="space-y-1">
            <Label htmlFor="lastname" className="text-[11px] font-semibold">
              Apellido *
            </Label>
            <Input
              id="lastname"
              name="lastname"
              placeholder="Ingresa el apellido"
              value={form.lastname}
              onChange={handleChange}
              required
              className="h-9 text-[11px]"
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-[11px] font-semibold">
              Teléfono *
            </Label>
            <Input
              id="phone"
              name="phone"
              placeholder="Ingresa el teléfono"
              value={form.phone}
              onChange={handleChange}
              required
              className="h-9 text-[11px]"
            />
          </div>

          {/* Correo */}
          <div className="space-y-1">
            <Label htmlFor="email" className="text-[11px] font-semibold">
              Correo
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={form.email}
              onChange={handleChange}
              className="h-9 text-[11px]"
            />
          </div>

          {/* Calle */}
          <div className="space-y-1">
            <Label htmlFor="street" className="text-[11px] font-semibold">
              Calle
            </Label>
            <Input
              id="street"
              name="street"
              placeholder="Ingresa la calle"
              value={form.street}
              onChange={handleChange}
              className="h-9 text-[11px]"
            />
          </div>

          {/* Colonia */}
          <div className="space-y-1">
            <Label htmlFor="neighborhood" className="text-[11px] font-semibold">
              Colonia
            </Label>
            <Input
              id="neighborhood"
              name="neighborhood"
              placeholder="Ingresa la colonia"
              value={form.neighborhood}
              onChange={handleChange}
              className="h-9 text-[11px]"
            />
          </div>

          {/* Ciudad */}
          <div className="space-y-1">
            <Label htmlFor="city" className="text-[11px] font-semibold">
              Ciudad
            </Label>
            <Input
              id="city"
              name="city"
              placeholder="Ingresa la ciudad"
              value={form.city}
              onChange={handleChange}
              className="h-9 text-[11px]"
            />
          </div>

          {/* Estado */}
          <div className="space-y-1">
            <Label htmlFor="state" className="text-[11px] font-semibold">
              Estado
            </Label>
            <Input
              id="state"
              name="state"
              placeholder="Ingresa el estado"
              value={form.state}
              onChange={handleChange}
              className="h-9 text-[11px]"
            />
          </div>
        </div>

        {error && (
          <p className="text-[11px] text-red-500">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-[#F5A524] px-6 text-xs font-semibold text-white hover:bg-[#f6b341]"
          >
            {submitting ? "Guardando..." : "Agregar cliente"}
          </Button>
        </div>
      </form>
    </div>
  );
}
