/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user context to requests
 */

import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services/tokenService';
import { AUTH_ERRORS } from '../types/index';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: 'student' | 'educator' | 'admin';
      };
    }
  }
}

/**
 * Extract JWT from Authorization header or cookies
 */
export function extractToken(req: Request): string | null {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Fall back to access_token cookie (set by login endpoint)
  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }

  return null;
}

/**
 * Require authentication middleware
 * Validates access token and attaches user context to request
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    res.status(AUTH_ERRORS.UNAUTHORIZED.statusCode).json({
      success: false,
      error: AUTH_ERRORS.UNAUTHORIZED.message,
    });
    return;
  }

  const result = tokenService.verifyAccessToken(token);

  if (!result.valid || !result.payload) {
    res.status(AUTH_ERRORS.INVALID_TOKEN.statusCode).json({
      success: false,
      error: AUTH_ERRORS.INVALID_TOKEN.message,
    });
    return;
  }

  // Attach user to request
  req.user = {
    userId: result.payload.userId,
    email: result.payload.email,
    role: result.payload.role,
  };

  next();
}

/**
 * Require specific role(s)
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(AUTH_ERRORS.UNAUTHORIZED.statusCode).json({
        success: false,
        error: AUTH_ERRORS.UNAUTHORIZED.message,
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(AUTH_ERRORS.FORBIDDEN.statusCode).json({
        success: false,
        error: AUTH_ERRORS.FORBIDDEN.message,
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication middleware
 * Doesn't fail if token is missing, but verifies if present
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  const result = tokenService.verifyAccessToken(token);

  if (result.valid && result.payload) {
    req.user = {
      userId: result.payload.userId,
      email: result.payload.email,
      role: result.payload.role,
    };
  }

  next();
}
