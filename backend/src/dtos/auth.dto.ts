export interface RegisterDto {
  name: string;
  lastname: string;
  email: string;
  password: string;
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
  createdAt: Date;
  updatedAt?: Date;
}

export interface AuthResponseDto {
  user: AuthUserDto;
  token: string;
}
