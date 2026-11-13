import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main>
      {/* HERO PRINCIPAL */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 lg:flex-row lg:items-center lg:py-16">
          {/* Texto izquierda */}
          <div className="flex-1 space-y-6">
            <h1 className="text-3xl font-extrabold leading-snug text-[#1A2D4D] lg:text-4xl">
              La seguridad que necesitas,
              <br />
              el impulso que merece tu negocio.
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Automatiza la gestión de tu negocio, controla inventario, ventas y
              gastos, y toma mejores decisiones con ayuda de inteligencia
              artificial, todo desde una sola plataforma.
            </p>

            <div className="flex flex-wrap gap-3 text-xs">
              <Link
                href="#soluciones"
                className="rounded-full bg-[#F5A524] px-5 py-2 text-sm font-semibold text-white hover:bg-[#f6b341]"
              >
                ¡Descubre más!
              </Link>
              <Link
                href="#precios"
                className="rounded-full border border-[#1A2D4D] px-5 py-2 text-sm font-semibold text-[#1A2D4D] hover:bg-[#1A2D4D]/5"
              >
                Ver planes
              </Link>
            </div>
          </div>

          {/* Imagen hero derecha */}
          <div className="flex-1">
            <div className="mx-auto max-w-md">
              <Image
                src="/hero.png"
                alt="Panel principal de SEA"
                width={640}
                height={480}
                className="h-auto w-full rounded-2xl object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN SOLUCIONES (admin, punto de venta, IA) */}
      <section
        id="soluciones"
        className="mx-auto max-w-6xl space-y-20 px-4 py-20"
      >
        {/* 1 — ADMINISTRACIÓN DE TU NEGOCIO */}
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">

            {/* Imagen derecha */}
          <div className="flex justify-center">
            <Image
              src="/admin-neg.jpeg"
              alt="Administración de tu negocio"
              width={640}
              height={420}
              className="h-auto w-full max-w-md object-contain"
            />
          </div>

          {/* Texto izquierda */}
          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold text-[#1A2D4D]">
              Administración de tu negocio
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Inventario, agenda, ventas, gastos, presupuestos y reportes en un
              solo lugar. Visualiza el estado de tu negocio en tiempo real y
              mantén todo organizado.
            </p>

            <CircleLink href="/auth/register" label="Ir" />
          </div>

          
        </div>

        {/* 2 — PUNTO DE VENTA (texto izquierda, imagen derecha analisis-de-datos) */}
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          {/* Texto izquierda */}
          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold text-[#1A2D4D]">
              Punto de venta
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Interfaz sencilla para registrar ventas, controlar tickets y
              realizar cobros rápidos. Registra clientes y empleados, genera
              reportes y mantén controlado tu negocio sin complicaciones.
            </p>

            <CircleLink href="/auth/register" label="Ir" />
          </div>

          {/* Imagen derecha */}
          <div className="flex justify-center">
            <Image
              src="/ia.png"
              alt="Punto de venta y análisis de datos"
              width={640}
              height={420}
              className="h-auto w-full max-w-md object-contain"
            />
          </div>
        </div>

        {/* 3 — INTEGRACIÓN DE IA (imagen izquierda, texto derecha) */}
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          {/* Imagen izquierda */}
          <div className="order-last flex justify-center lg:order-first">
            <Image
              src="/analisis-de-datos.png"
              alt="Integración de inteligencia artificial"
              width={640}
              height={420}
              className="h-auto w-full max-w-md object-contain"
            />
          </div>

          {/* Texto derecha */}
          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold text-[#1A2D4D]">
              Integración de IA
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Haz preguntas sobre tu negocio, genera ideas, obtén resúmenes de
              tus ventas, recibe recomendaciones y automatiza tareas
              repetitivas con asistencia de inteligencia artificial.
            </p>

            <CircleLink href="/auth/register" label="Ir" />
          </div>
        </div>
      </section>

      {/* PLANES / PRECIOS */}
      <section
        id="precios"
        className="border-y border-border bg-card py-14 text-foreground"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 space-y-2 text-center">
            <h2 className="text-2xl font-extrabold text-[#1A2D4D]">
              Elige tu plan ideal
            </h2>
            <p className="mx-auto max-w-2xl text-xs text-muted-foreground">
              Comienza gratis y escala cuando tu negocio lo necesite. Todos los
              planes incluyen acceso seguro a la plataforma y soporte básico.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <PricingCard
              highlight={false}
              title="Gratis"
              price="$0 MXN"
              badge=""
              description="El plan ideal para comenzar."
              features={[
                "Gestión de inventario",
                "Registro de ventas y gastos",
                "Reportes básicos",
                "Acceso desde cualquier lugar",
                "1 administrador y 1 usuario",
              ]}
            />

            <PricingCard
              highlight
              title="Avanzado"
              price="$179 MXN"
              badge="Más recomendado"
              description="Aprovecha todo el poder de SEA."
              features={[
                "Todo lo del plan Gratis",
                "Análisis avanzado del negocio",
                "Clientes y facturación",
                "Integración de IA sin límites",
                "Automatización de mensajes",
                "1 administrador y 3 usuarios",
              ]}
            />
          </div>
        </div>
      </section>

      {/* BANNER: Trabaja donde estés */}
      <section className="bg-[#1A2D4D] text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-10 lg:py-12">
          <h2 className="text-2xl font-extrabold">
            Trabaja, donde quiera que estés.
          </h2>
          <p className="max-w-xl text-xs text-white/90">
            Accede a tu información desde cualquier dispositivo con conexión a
            internet y mantén el control de tu negocio en todo momento.
          </p>
          <Link
            href="/auth/register"
            className="rounded-full bg-[#F5A524] px-6 py-2 text-xs font-semibold text-[#1A2D4D] hover:bg-[#f6b341]"
          >
            Empezar ahora
          </Link>
        </div>
      </section>

      {/* SEGURIDAD */}
      <section id="ayuda" className="border-b border-border bg-card py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.1fr,1fr]">
          <div className="space-y-3">
            <h2 className="text-xl font-extrabold text-[#1A2D4D]">
              100% <span className="text-[#1A2D4D]">seguros</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Tu información se almacena usando buenas prácticas de seguridad y
              cifrado. Nos preocupamos por proteger los datos de tu negocio y de
              tus clientes.
            </p>
            <Link
              href="#"
              className="inline-flex items-center rounded-full bg-[#F5A524] px-4 py-2 text-xs font-semibold text-white hover:bg-[#f6b341]"
            >
              Leer más
            </Link>
          </div>
          <div className="rounded-2xl bg-muted">
            {/* Aquí podrías agregar otra imagen de seguridad si quieres */}
          </div>
        </div>
      </section>

      {/* ¿Sientes dudas? */}
      <section className="bg-[#1A2D4D] text-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-xl space-y-3">
            <h2 className="text-xl font-extrabold">¿Sientes dudas?</h2>
            <p className="text-xs text-white/90">
              La tecnología no tiene por qué ser complicada. Escríbenos y te
              ayudamos a entender cómo SEA puede adaptarse a tu negocio.
            </p>
            <Link
              href="#contacto"
              className="inline-flex items-center rounded-full bg-[#F5A524] px-4 py-2 text-xs font-semibold text-[#1A2D4D] hover:bg-[#f6b341]"
            >
              Contáctanos
            </Link>
          </div>
        </div>
      </section>

      {/* ¿Quiénes somos? */}
      <section id="conocenos" className="bg-card py-12">
        <div className="mx-auto max-w-5xl space-y-5 px-4 text-center">
          <h2 className="text-xl font-extrabold text-[#1A2D4D]">
            ¿Quiénes somos?
          </h2>
          <p className="text-xs text-muted-foreground">
            SEA Soluciones de Tecnología y Software
          </p>
          <p className="mx-auto max-w-3xl text-xs text-muted-foreground">
            Somos una organización enfocada en ayudarte a automatizar y
            profesionalizar tu negocio. Diseñamos herramientas sencillas,
            accesibles y pensadas para las necesidades reales de los pequeños y
            medianos comercios.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1A2D4D] text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 text-xs">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Branding */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="">
                                          <Image
                                              src="/sea-logo-blanco2.png"
                                              alt="SEA Logo"
                                              width={100}
                                              height={100}
                                              className="h-10 w-10 object-contain"
                                          />
                            </div>
                <div>
                  <p className="text-sm font-extrabold">SEA</p>
                  <p className="text-[10px] text-white/80">
                    Soluciones de Tecnología y Software
                  </p>
                </div>
              </div>
            </div>

            {/* Producto */}
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide">
                Producto
              </h3>
              <ul className="space-y-1 text-[11px] text-white/80">
                <li>
                  <Link href="/" className="hover:text-[#F5A524]">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link href="#precios" className="hover:text-[#F5A524]">
                    Precios
                  </Link>
                </li>
              </ul>
            </div>

            {/* Recursos */}
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide">
                Recursos
              </h3>
              <ul className="space-y-1 text-[11px] text-white/80">
                <li>Preguntas frecuentes</li>
                <li>Ayuda</li>
              </ul>
            </div>

            {/* CTA final */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wide">
                Pruébalo hoy
              </h3>
              <p className="text-[11px] text-white/80">
                Empieza gratis y cambia de plan cuando lo necesites.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex rounded-full bg-[#F5A524] px-4 py-2 text-[11px] font-semibold text-[#1A2D4D] hover:bg-[#f6b341]"
              >
                Estoy dentro
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-white/20 pt-4 text-[10px] text-white/70">
            <span>Términos y condiciones</span>
            <span>Seguridad</span>
            <span>© {new Date().getFullYear()} SEA.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* --- Componentes auxiliares reutilizables --- */

type PricingCardProps = {
  highlight?: boolean;
  title: string;
  price: string;
  badge?: string;
  description: string;
  features: string[];
};

function PricingCard({
  highlight,
  title,
  price,
  badge,
  description,
  features,
}: PricingCardProps) {
  return (
    <div
      className={`rounded-2xl border px-6 py-5 text-xs ${
        highlight
          ? "border-[#F5A524] bg-[#F5A524]/5 shadow-soft"
          : "border-border bg-card"
      }`}
    >
      {badge && (
        <p className="mb-1 text-[10px] font-semibold text-[#F5A524]">
          {badge}
        </p>
      )}
      <h3 className="text-sm font-extrabold text-[#1A2D4D]">{title}</h3>
      <p className="mt-1 text-lg font-extrabold text-[#1A2D4D]">{price}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>

      <ul className="mt-4 space-y-1 text-[11px] text-muted-foreground">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>

      <div className="mt-4">
        <Link
          href="/auth/register"
          className={`inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-[11px] font-semibold ${
            highlight
              ? "bg-[#F5A524] text-[#1A2D4D] hover:bg-[#f6b341]"
              : "border border-[#1A2D4D] text-[#1A2D4D] hover:bg-[#1A2D4D]/5"
          }`}
        >
          Empezar
        </Link>
      </div>
    </div>
  );
}

type CircleLinkProps = {
  href: string;
  label: string;
};

function CircleLink({ href, label }: CircleLinkProps) {
  return (
    <Link href={href} className="inline-flex">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5A524] text-[11px] font-semibold text-white hover:bg-[#f6b341]">
        {label}
      </span>
    </Link>
  );
}
