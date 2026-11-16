import { Role } from "@prisma/client";

export interface CreateUserDto {
  name: string;
  lastname: string;
  email: string;
  password: string;
  role: Role;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthUserDto {
  id: string;
  name: string;
  lastname: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AuthResponseDto {
  user: AuthUserDto;
  token: string;
}
