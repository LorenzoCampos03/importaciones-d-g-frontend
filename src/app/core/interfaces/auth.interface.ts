export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  userId?: number;
  username?: string;
  role?: string;
  name?: string;
  lastName?: string;
  email?: string;
}

export interface AuthUser {
  userId: number;
  username: string;
  role: string;
  name: string;
  lastName: string;
  email: string;
  token: string;
  refreshToken?: string;
}

export interface ChangePasswordRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  document_type: string;
  document_number: string;
  razon_social?: string; // Para empresas
  role?: string; // Por defecto será 'Cliente'
  status?: string; // Por defecto será 'A'
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ValidationResponse {
  field: string;
  exists: boolean;
  message: string;
}
