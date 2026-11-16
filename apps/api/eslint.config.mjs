import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Los tests de integración cargan `app` y `prisma` con import dinámico tras fijar
    // DATABASE_URL, así que no tienen tipo estático; tiparlos exigiría reestructurar el arnés.
    files: ["test/**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
);
