/**
 * Auth Middleware for Payment Service
 */

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3008';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Require authentication
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const accessToken = req.cookies?.accessToken || 
      req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Verify token with auth service
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    req.user = response.data.user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Require admin role
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'super_admin' && req.user.role !== 'instructor') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}
