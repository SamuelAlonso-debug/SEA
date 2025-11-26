import bcrypt from "bcrypt";
import prisma from "../config/prisma";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";
import { signToken } from "../utils/jwt";

const SALT_ROUNDS = 10;

export const registerUser = async (data: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("El correo ya está registrado");
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
  });

  const token = signToken({ userId: user.id });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
};

export const loginUser = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error("Credenciales inválidas");
  }

  const isValidPassword = await bcrypt.compare(
    data.password,
    user.password
  );

  if (!isValidPassword) {
    throw new Error("Credenciales inválidas");
  }

  const token = signToken({ userId: user.id });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
};

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    // si luego quieres cargar ventas:
    // include: { sales: true },
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    // sales: user.sales // si usas include
  };
};
