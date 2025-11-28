"use client";

import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LabeledInput } from "@/components/forms/labeled-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="space-y-8">
        {/* Encabezado */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">
            Bienvenido de vuelta!
          </p>
          <h1 className="text-3xl font-extrabold text-foreground">
            Inicia Sesión
          </h1>
        </div>

        {/* Formulario */}
        <form className="space-y-5">
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
              placeholder="Ingresa tu contraseña"
            />
          </div>

          {/* Recordar + Olvidé contraseña */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
              <Checkbox id="remember" />
              <span>Recordar</span>
            </label>

            <Link
              href="#"
              className="font-semibold text-primary hover:text-primary/80"
            >
              Olvidé mi contraseña
            </Link>
          </div>

          {/* Botón */}
          <Button
            type="submit"
            className="mt-2 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Iniciar Sesión
          </Button>
        </form>

        {/* Link a registro */}
        <p className="text-[11px] text-muted-foreground">
          ¿Aún no tienes cuenta?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-primary hover:text-primary/80"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
