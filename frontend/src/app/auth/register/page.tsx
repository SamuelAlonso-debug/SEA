"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { LabeledInput } from "@/components/forms/labeled-input";
import { Button } from "@/components/ui/button";

import { registerRequest } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();

  // Estado del formulario
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Estado UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await registerRequest({
        name,
        lastname,
        email,
        password,
      });

      // 👇 NO guardamos token, solo mandamos a login
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.message ?? "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

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
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput
              name="name"
              label="Nombre"
              placeholder="Ingresa tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <LabeledInput
              name="lastname"
              label="Apellidos"
              placeholder="Ingresa tus apellidos"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <LabeledInput
              name="email"
              label="Correo electrónico"
              type="email"
              placeholder="Ingresa correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <LabeledInput
              name="password"
              label="Contraseña"
              type="password"
              placeholder="Crea una contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}

          {/* Botón */}
          <Button
            type="submit"
            className="mt-2 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
            disabled={loading}
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
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
