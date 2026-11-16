// Clave de orden sin mayúsculas ni acentos: Prisma con Mongo no expone collation en findMany.
// Misma regla en prisma/backfill-client-sort-name.mjs.
export const toSortName = (name: string, lastname: string) =>
  `${name} ${lastname}`.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
