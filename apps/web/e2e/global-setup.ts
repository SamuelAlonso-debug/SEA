import { request } from "@playwright/test";
import { API_URL, AUTH_FILE, USER } from "./fixtures";

// Un usuario sembrado por la API y su sesión guardada: los specs no repiten login
// (el limitador de /auth es de 10 peticiones por 15 min).
export default async function globalSetup() {
  const api = await request.newContext();
  const res = await api.post(`${API_URL}/auth/register`, { data: USER });
  if (!res.ok()) throw new Error(`No se pudo sembrar el usuario: ${res.status()}`);
  const { token, user } = await res.json();
  const origin = "http://localhost:3100";
  const localStorage = [
    { name: "sea_token", value: token },
    { name: "sea_user", value: JSON.stringify(user) },
  ];
  const { writeFileSync } = await import("node:fs");
  writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [{ origin, localStorage }] }));
  await api.dispose();
}
