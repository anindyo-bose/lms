/**
 * Auth Widget Contract
 * Defines the interface for authentication and session management
 */

export interface IAuthWidget {
  getCurrentUser(): Promise<User | null>;
  login(email: string, password: string): Promise<LoginResult>;
  signup(data: SignupPayload): Promise<LoginResult>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  refreshToken(): Promise<string>;
  logout(): Promise<void>;
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'educator' | 'admin' | 'super_admin';
  createdAt: string;
  lastLoginAt: string | null;
  mustChangePassword: boolean;
}

export interface LoginResult {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface SignupPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'educator';
  agreedToTerms: boolean;
}

export class AuthError extends Error {
  constructor(
    public code: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'EMAIL_NOT_VERIFIED' | 'VALIDATION_ERROR',
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
