import type { ReactNode } from "react";
import Image from "next/image";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Columna izquierda: fondo blanco + formulario */}
      <div className="flex flex-col justify-center bg-card px-8 py-10 lg:px-16">

        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Columna derecha: panel azul con logo SEA grande */}
      <div className="hidden lg:flex items-center justify-center bg-primary text-primary-foreground">
        <div className="flex items-center gap-4">

             {/* Logo pequeño arriba */}
        <div className="flex items-center gap-3 px-6 py-6">
                        <Image
                            src="/sea-logo-blanco2.png"
                            alt="SEA Logo"
                            width={100}
                            height={100}
                            className="h-40 w-40 object-contain"
                        />
        </div>

          <span className="text-4xl font-extrabold tracking-wide">SEA</span>
        </div>
      </div>
    </div>
  );
}
