/**
 * Type definitions for Auth Service
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'educator' | 'admin';
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'student' | 'educator' | 'admin';
  iat?: number;
  exp?: number;
  type: 'access' | 'refresh';
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'student' | 'educator';
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface RefreshResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface AuthError {
  code: string;
  message: string;
  statusCode: number;
}

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
    statusCode: 401,
  },
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
    statusCode: 404,
  },
  USER_EXISTS: {
    code: 'USER_EXISTS',
    message: 'User with this email already exists',
    statusCode: 409,
  },
  INVALID_TOKEN: {
    code: 'INVALID_TOKEN',
    message: 'Invalid or expired token',
    statusCode: 401,
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Unauthorized',
    statusCode: 401,
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Forbidden',
    statusCode: 403,
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    statusCode: 500,
  },
};
