import bcrypt from "bcrypt";
import prisma from "../../shared/prisma";
import { createSession } from "../../shared/session";
import { ConflictError, HttpError, NotFoundError } from "../../shared/errors";
import { AuthResponseDto, CreateUserDto, LoginDto } from "./auth.dto";

const SALT_ROUNDS = 10;

const EMAIL_TAKEN = "El correo ya está registrado";
// Mismo mensaje para correo inexistente y contraseña incorrecta: no revela qué cuentas existen.
const BAD_CREDENTIALS = "Correo o contraseña incorrectos";

// Datos públicos del usuario: nunca el hash de la contraseña.
const publicUser = {
  id: true,
  name: true,
  lastname: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

// Alta de personal por un ADMIN (POST /api/users): sin sesión para el usuario creado.
export const createUser = async (data: CreateUserDto) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ConflictError(EMAIL_TAKEN);
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  // P2002: alta simultánea con el mismo correo; el índice único decide.
  return prisma.user
    .create({ data: { ...data, password: hashedPassword }, select: publicUser })
    .catch((error) => {
      throw error?.code === "P2002" ? new ConflictError(EMAIL_TAKEN) : error;
    });
};

export const listUsers = () => prisma.user.findMany({ select: publicUser, orderBy: { createdAt: "asc" } });

export const loginUser = async (data: LoginDto): Promise<AuthResponseDto> => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !(await bcrypt.compare(data.password, user.password))) {
    throw new HttpError(401, BAD_CREDENTIALS);
  }

  const token = await createSession(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    token,
  };
};

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUser,
  });

  if (!user) {
    throw new NotFoundError("Usuario no encontrado");
  }

  return user;
};
