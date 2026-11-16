"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { profileRequest } from "./api";
import type { User } from "@/types/api";

const PUBLIC_ROUTES = ["/landing", "/auth/login", "/auth/register"];

interface Session {
  user: User | null;
  setUser: (user: User | null) => void;
}

const SessionContext = createContext<Session>({ user: null, setUser: () => {} });

// Usuario de la sesión: lo carga AuthGuard y lo fija el login.
export const useSession = () => useContext(SessionContext);

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // undefined: aún no se sabe si hay sesión.
  const [user, setUser] = useState<User | null | undefined>(undefined);

  // La cookie es httpOnly: solo la API sabe si hay sesión válida.
  useEffect(() => {
    profileRequest().then(setUser, () => setUser(null));
  }, []);

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  let redirect: string | null = null;
  if (user === null && !isPublic) redirect = "/auth/login";
  // Con sesión, /auth/* va al dashboard. "/" redirige a /landing y dejaba el login inalcanzable.
  if (user && pathname.startsWith("/auth")) redirect = "/dashboard";

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (user === undefined || redirect) return null;

  return <SessionContext.Provider value={{ user, setUser }}>{children}</SessionContext.Provider>;
}
