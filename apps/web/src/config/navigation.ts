import { LayoutDashboard, ShoppingCart, Boxes, Bell, Users, Wallet } from "lucide-react";
import type { Role } from "@/types/api";
// Si luego quieres Solar Icons, aquí es donde cambias los imports.

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  active?: boolean;
};

export const mainNav: NavItem[] = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: LayoutDashboard,
    active: true,
  },
  {
    label: "Ventas",
    href: "/dashboard/sales",
    icon: ShoppingCart,
    active: true,
  },
  {
    label: "Inventario",
    href: "/dashboard/inventory",
    icon: Boxes,
    active: true,
  },
  // visibles pero sin funcionalidad real por ahora:
  {
    label: "Gastos",
    href: "/dashboard/expenses",
    icon: Wallet,
    active: true,
  },
  {
    label: "Clientes",
    href: "/dashboard/client",
    icon: Users,
    active: true,
  },
  {
    label: "Notificaciones",
    href: "#",
    icon: Bell,
    active: false,
  },
];

// Pantallas solo ADMIN. La API también las rechaza (403): ocultarlas evita vistas que solo fallarían.
const ADMIN_ONLY = ["/dashboard/expenses", "/dashboard/inventory/new"];

// El inicio del dashboard son KPIs, solo ADMIN.
export const canAccess = (path: string, role: Role) =>
  role === "ADMIN" || (path !== "/dashboard" && !ADMIN_ONLY.some((p) => path.startsWith(p)));

export const homeFor = (role: Role) => (role === "ADMIN" ? "/dashboard" : "/dashboard/sales");
