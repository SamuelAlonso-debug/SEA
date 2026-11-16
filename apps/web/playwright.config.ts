import { defineConfig } from "@playwright/test";

// Puertos propios: no chocan con los dev servers (3000/4000) ni reutilizan su BD.
const WEB_PORT = 3100;
const API_PORT = 4100;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // El limitador de /auth (10 por 15 min) es compartido: un solo worker y sin reintentos.
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
    storageState: "e2e/.auth.json", // sesión sembrada en global-setup
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: [
    {
      // Mongo en memoria con replica set + API (ver e2e/api-server.mjs).
      command: "node e2e/api-server.mjs",
      url: `http://localhost:${API_PORT}/api/health/ready`,
      env: {
        PORT: String(API_PORT),
        CORS_ORIGIN: `http://localhost:${WEB_PORT}`,
        JWT_SECRET: process.env.JWT_SECRET ?? "e2e-local-secret",
        BUSINESS_TIMEZONE: "America/Mexico_City",
      },
      timeout: 180_000,
    },
    {
      // NEXT_PUBLIC_API_URL se fija en el build.
      command: `npm run build && npm start -- -p ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}/landing`,
      env: { NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}/api` },
      timeout: 300_000,
    },
  ],
});
