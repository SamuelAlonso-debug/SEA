import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import Image from "next/image";

export function MarketingNavbar() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Logo SEA */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center gap-3 px-6 py-6">
                          <Image
                              src="/sea-logo2.png"
                              alt="SEA Logo"
                              width={100}
                              height={100}
                              className="h-10 w-10 object-contain"
                          />
            </div>

            <div className="flex flex-col">
                    <span className="text-sm font-extrabold tracking-tight text-foreground">
                        SEA
                    </span>
                </div>
        </Link>

        {/* Navegación centro */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-[#1A2D4D] lg:flex">
          <Link href="#conocenos" className="hover:text-black">
            Conocenos
          </Link>

          <button
            className="inline-flex items-center gap-1 hover:text-black"
            type="button"
          >
            <span>Soluciones</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          <button
            className="inline-flex items-center gap-1 hover:text-black"
            type="button"
          >
            <span>Precios</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          <button
            className="inline-flex items-center gap-1 hover:text-black"
            type="button"
          >
            <span>Ayuda</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </nav>

        {/* Botones derecha */}
        <div className="flex items-center gap-3 text-sm font-semibold">
          <Link
            href="/auth/login"
            className="hidden rounded-xl bg-[#F5A524] px-5 py-2 text-[#1A2D4D] hover:bg-[#f6b341] lg:inline-flex"
          >
            Inicio de Sesión
          </Link>

          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1A2D4D] px-5 py-2 text-white hover:bg-[#13223a]"
          >
            <span>Empezar Gratis!</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
