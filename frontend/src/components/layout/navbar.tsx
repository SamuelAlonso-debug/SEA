"use client";

import { Bell } from "lucide-react";

export function Navbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-secondary px-8">
      <div>
        {/* Este título lo controlaremos por página, pero puedes dejar algo genérico */}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted text-primary hover:bg-muted/80 transition">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-success" />
        </button>

        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
            OJ
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              Otor John
            </span>
            <span className="text-xs text-muted-foreground">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
