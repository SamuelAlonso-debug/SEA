import { LayoutDashboard, ShoppingCart, Boxes, Bell, Users, Wallet } from "lucide-react";
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
    href: "#",
    icon: Users,
    active: false,
  },
  {
    label: "Notificaciones",
    href: "#",
    icon: Bell,
    active: false,
  },
];
