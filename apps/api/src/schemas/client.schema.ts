import { z } from "zod";

// Campos obligatorios para crear
export const createClientSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre es demasiado largo"),
  lastname: z
    .string()
    .min(1, "El apellido es obligatorio")
    .max(100, "El apellido es demasiado largo"),
  phone: z
    .string()
    .min(7, "El teléfono es demasiado corto")
    .max(20, "El teléfono es demasiado largo"),
  email: z.string().email("Email inválido").optional().nullable(),
  street: z.string().max(200).optional().nullable(),
  neighborhood: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
});

export const updateClientSchema = createClientSchema.partial();

// Query params para listar
export const listClientsQuerySchema = z.object({
  search: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10)),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ListClientsQueryInput = z.infer<typeof listClientsQuerySchema>;