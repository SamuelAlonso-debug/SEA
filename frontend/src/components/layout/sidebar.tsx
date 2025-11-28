"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="flex h-screen w-64 flex-col border-r border-border bg-secondary">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
                <Image
                    src="/sea-logo2.png"
                    alt="SEA Logo"
                    width={100}
                    height={100}
                    className="h-10 w-10 object-contain"
                />

                <div className="flex flex-col">
                    <span className="text-sm font-extrabold tracking-tight text-foreground">
                        SEA
                    </span>
                    <span className="text-xs text-muted-foreground">Admin Panel</span>
                </div>
            </div>


            {/* Navegación */}
            <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
                {mainNav.map((item) => {
                    const isActive =
                        item.active && pathname.startsWith(item.href) && item.href !== "#";

                    const Icon = item.icon;

                    const baseClasses =
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors";

                    return item.active ? (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                baseClasses,
                                "hover:bg-sidebar hover:text-primary",
                                isActive
                                    ? "bg-sidebar text-primary font-semibold"
                                    : "text-muted-foreground"
                            )}
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sidebar text-primary">
                                <Icon className="h-4 w-4" />
                            </span>
                            <span>{item.label}</span>
                        </Link>
                    ) : (
                        <div
                            key={item.label}
                            className={cn(
                                baseClasses,
                                "text-muted-foreground/60 cursor-not-allowed"
                            )}
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-primary/40">
                                <Icon className="h-4 w-4" />
                            </span>
                            <span>{item.label}</span>
                        </div>
                    );
                })}
            </nav>

            {/* Footer pequeño si quieres */}
            <div className="px-6 py-4 text-xs text-muted-foreground border-t border-border">
                v1.0.0
            </div>
        </aside>
    );
}
