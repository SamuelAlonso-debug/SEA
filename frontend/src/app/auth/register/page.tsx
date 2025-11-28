"use client";

import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LabeledInput } from "@/components/forms/labeled-input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <AuthLayout>
      <div className="space-y-8">
        {/* Encabezado */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">
            Crea tu cuenta
          </p>
          <h1 className="text-3xl font-extrabold text-foreground">
            Registrarse
          </h1>
        </div>

        {/* Formulario */}
        <form className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput
              name="name"
              label="Nombre"
              placeholder="Ingresa tu nombre"
            />
            <LabeledInput
              name="lastname"
              label="Apellidos"
              placeholder="Ingresa tus apellidos"
            />
          </div>

          <div className="space-y-3">
            <LabeledInput
              name="email"
              label="Correo electrónico"
              type="email"
              placeholder="Ingresa correo electrónico"
            />
            <LabeledInput
              name="password"
              label="Contraseña"
              type="password"
              placeholder="Crea una contraseña"
            />
          </div>

          {/* Botón */}
          <Button
            type="submit"
            className="mt-2 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Crear cuenta
          </Button>
        </form>

        {/* Link a login */}
        <p className="text-[11px] text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-primary hover:text-primary/80"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
