import { z } from "zod";
import {
  UserNameLength,
  UserLastNameLength,
  UserEmailLength,
  UserPasswordLength,
} from "./user.enums";

// El correo se normaliza (trim, minúsculas): una cuenta por correo sin importar mayúsculas.
export const registerSchema = z.object({
  name: z
    .string()
    .min(
      UserNameLength.MIN,
      `El nombre debe tener al menos ${UserNameLength.MIN} caracteres`
    )
    .max(
      UserNameLength.MAX,
      `El nombre no puede tener más de ${UserNameLength.MAX} caracteres`
    ),

  lastname: z
    .string()
    .min(
      UserLastNameLength.MIN,
      `El apellido debe tener al menos ${UserLastNameLength.MIN} caracteres`
    )
    .max(
      UserLastNameLength.MAX,
      `El apellido no puede tener más de ${UserLastNameLength.MAX} caracteres`
    ),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(
      UserEmailLength.MIN,
      `El correo debe tener al menos ${UserEmailLength.MIN} caracteres`
    )
    .max(
      UserEmailLength.MAX,
      `El correo no puede tener más de ${UserEmailLength.MAX} caracteres`
    )
    .email("Correo inválido"),

  password: z
    .string()
    .min(
      UserPasswordLength.MIN,
      `La contraseña debe tener al menos ${UserPasswordLength.MIN} caracteres`
    )
    .max(
      UserPasswordLength.MAX,
      `La contraseña no puede tener más de ${UserPasswordLength.MAX} caracteres`
    ),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria"),
});

// Tipos que usarán tus servicios
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
