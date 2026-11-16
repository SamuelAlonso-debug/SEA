import { request } from "@playwright/test";
import { API_URL, AUTH_FILE, USER } from "./fixtures";

// El ADMIN que siembra e2e/api-server.mjs y su cookie de sesión guardada: los specs no repiten login
// (el limitador de /auth es de 10 peticiones por 15 min).
export default async function globalSetup() {
  const api = await request.newContext();
  const login = await api.post(`${API_URL}/auth/login`, { data: { email: USER.email, password: USER.password } });
  if (!login.ok()) throw new Error(`No se pudo iniciar sesión: ${login.status()}`);
  // Solo la cookie httpOnly sea_session: la web ya no guarda nada en localStorage.
  await api.storageState({ path: AUTH_FILE });
  await api.dispose();
}
