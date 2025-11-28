"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Bell, LogOut, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getUser, clearToken, clearUser } from "@/lib/auth-client";

interface StoredUser {
  id: string;
  name: string;
  lastname: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const u = getUser();
    if (u) setUser(u);
  }, []);

  const initials = user
    ? `${user.name?.[0] ?? ""}${user.lastname?.[0] ?? ""}`.toUpperCase()
    : "SE";

  const fullName = user
    ? `${user.name} ${user.lastname}`
    : "Usuario SEA";

  const handleLogout = () => {
    clearToken();
    clearUser();
    router.push("/landing");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-secondary px-8">
      {/* Aquí puedes poner el título dinámico por página */}
      <div />

      <div className="flex items-center gap-4">
        {/* Notificaciones */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted text-primary hover:bg-muted/80 transition">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-success" />
        </button>

        {/* Usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                {initials}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold text-foreground">
                  {fullName}
                </span>
                <span className="text-xs text-muted-foreground">
                  Admin
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>

          {/* Menú desplegable */}
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">{fullName}</span>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs text-red-600 cursor-pointer"
            >
              <LogOut className="h-3 w-3" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
