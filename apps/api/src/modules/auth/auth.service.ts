import bcrypt from "bcrypt";
import prisma from "../../shared/prisma";
import { RegisterInput, LoginInput } from "./auth.schema";
import { signToken } from "../../shared/jwt";
import { AuthResponseDto } from "./auth.dto";

const SALT_ROUNDS = 10;

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const EMAIL_TAKEN = "El correo ya está registrado";
// Mismo mensaje para correo inexistente y contraseña incorrecta: no revela qué cuentas existen.
const BAD_CREDENTIALS = "Correo o contraseña incorrectos";

export const registerUser = async (data: RegisterInput): Promise<AuthResponseDto> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AuthError(409, EMAIL_TAKEN);
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  // P2002: alta simultánea con el mismo correo; el índice único decide.
  const user = await prisma.user
    .create({
      data: {
        name: data.name,
        lastname: data.lastname,
        email: data.email,
        password: hashedPassword,
      },
    })
    .catch((error) => {
      throw error?.code === "P2002" ? new AuthError(409, EMAIL_TAKEN) : error;
    });

  const token = signToken({ userId: user.id });

  return {
    user: {
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    token,
  };
};

export const loginUser = async (data: LoginInput): Promise<AuthResponseDto> => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !(await bcrypt.compare(data.password, user.password))) {
    throw new AuthError(401, BAD_CREDENTIALS);
  }

  const token = signToken({ userId: user.id });

  return {
    user: {
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    token,
  };
};

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  return {
    id: user.id,
    name: user.name,
    lastname: user.lastname,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
