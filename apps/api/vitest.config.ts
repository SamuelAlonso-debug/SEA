import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // TZ=UTC como en Docker: los rangos no deben depender de la zona del proceso.
    env: { JWT_SECRET: "test-secret", BUSINESS_TIMEZONE: "America/Mexico_City", TZ: "UTC" },
    // Binario de Mongo descargado una vez antes de los workers (ver global-setup.ts).
    globalSetup: ["test/integration/global-setup.ts"],
  },
});
