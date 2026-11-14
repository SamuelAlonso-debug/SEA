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
