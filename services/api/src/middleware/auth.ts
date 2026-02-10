/**
 * Authentication Middleware for API Service
 * Validates JWT tokens from requests
 */

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

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

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3007';

/**
 * Verify token with auth service
 */
async function verifyTokenWithAuthService(token: string) {
  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/auth/verify`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      }
    );

    return response.data.payload;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from request
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }

  return null;
}

/**
 * Require authentication middleware
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
    return;
  }

  // Verify token with auth service
  verifyTokenWithAuthService(token).then((payload) => {
    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  });
}

/**
 * Require specific role(s)
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
      });
      return;
    }

    next();
  };
}
