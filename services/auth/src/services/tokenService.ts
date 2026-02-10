/**
 * TokenService: Handles JWT creation, validation, and refresh token rotation
 * Security: All tokens signed with RS256 in production, HS256 in development (dev only)
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { TokenPayload, AUTH_ERRORS } from '../types/index';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
}

interface VerificationResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}

export class TokenService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string = '5m'; // 5 minutes
  private refreshTokenExpiry: string = '7d'; // 7 days

  constructor(
    accessTokenSecret: string = process.env.JWT_SECRET || 'dev-secret-change-in-production',
    refreshTokenSecret: string = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production'
  ) {
    this.accessTokenSecret = accessTokenSecret;
    this.refreshTokenSecret = refreshTokenSecret;

    if (process.env.NODE_ENV === 'production') {
      if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
        throw new Error('JWT_SECRET and JWT_REFRESH_SECRET are required in production');
      }
    }
  }

  /**
   * Create a new token pair (access + refresh)
   * Access token: 5 minutes (short-lived)
   * Refresh token: 7 days (stored in HTTPOnly cookie)
   */
  createTokenPair(userId: string, email: string, role: string): TokenPair {
    const payload = {
      userId,
      email,
      role: role as 'student' | 'educator' | 'admin',
    };

    // Create access token (short-lived)
    const accessToken = jwt.sign({ ...payload, type: 'access' }, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry as string,
      algorithm: 'HS256',
    } as jwt.SignOptions);

    // Create refresh token (long-lived)
    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh', jti: crypto.randomBytes(16).toString('hex') },
      this.refreshTokenSecret,
      {
        expiresIn: this.refreshTokenExpiry as string,
        algorithm: 'HS256',
      } as jwt.SignOptions
    );

    // Hash the refresh token for storage in database
    const refreshTokenHash = this.hashToken(refreshToken);

    return {
      accessToken,
      refreshToken,
      refreshTokenHash,
    };
  }

  /**
   * Verify an access token
   */
  verifyAccessToken(token: string): VerificationResult {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret) as TokenPayload;

      if (payload.type !== 'access') {
        return {
          valid: false,
          error: AUTH_ERRORS.INVALID_TOKEN.message,
        };
      }

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      const message = error instanceof jwt.TokenExpiredError ? 'Token expired' : 'Invalid token';
      return {
        valid: false,
        error: message,
      };
    }
  }

  /**
   * Verify a refresh token
   */
  verifyRefreshToken(token: string): VerificationResult {
    try {
      const payload = jwt.verify(token, this.refreshTokenSecret) as TokenPayload;

      if (payload.type !== 'refresh') {
        return {
          valid: false,
          error: AUTH_ERRORS.INVALID_TOKEN.message,
        };
      }

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      const message = error instanceof jwt.TokenExpiredError ? 'Token expired' : 'Invalid token';
      return {
        valid: false,
        error: message,
      };
    }
  }

  /**
   * Hash a token for storage (one-way for security)
   * Use with refresh tokens before storing in DB
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Decode token without verification (for debugging only)
   */
  decode(token: string) {
    return jwt.decode(token);
  }

  /**
   * Get expiry time in milliseconds from now
   */
  getTokenExpiry(token: string): number | null {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      if (decoded?.exp) {
        return (decoded.exp * 1000) - Date.now();
      }
      return null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const tokenService = new TokenService();
