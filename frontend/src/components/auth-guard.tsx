"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const TOKEN_KEY = "sea_token";

// 👇 añadimos /auth/register aquí
const PUBLIC_ROUTES = ["/landing", "/auth/login", "/auth/register"];

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();

    const isPublic = PUBLIC_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    // 🔒 Sin token y NO es ruta pública → al login
    if (!token && !isPublic) {
      router.replace("/auth/login");
      return;
    }

    // 🔑 Con token y estás en cualquier ruta /auth/* → al dashboard
    if (token && pathname.startsWith("/auth")) {
      router.replace("/");
      return;
    }

    setReady(true);
  }, [pathname, router]);

  if (!ready) return null;

  return <>{children}</>;
}
