/**
 * Authentication Routes
 * POST /auth/login - Login with email/password
 * POST /auth/signup - Register new user
 * POST /auth/refresh - Refresh access token
 * POST /auth/logout - Logout (revoke tokens)
 * GET /auth/me - Get current user
 */

import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService';
import { tokenService } from '../services/tokenService';
import { requireAuth } from '../middleware/auth';
import { AUTH_ERRORS, LoginRequest, SignupRequest } from '../types/index';
import { Pool } from 'pg';
import crypto from 'crypto';

export function createAuthRouter(pool: Pool): Router {
  const router = Router();
  const userService = new UserService(pool);

  /**
   * POST /auth/login
   * Login with email and password
   * Sets HTTPOnly cookie with refresh token (7 days)
   * Returns access token (5 minutes) in response
   */
  router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body as LoginRequest;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
        return;
      }

      // Verify password
      const user = await userService.verifyPassword(email, password);

      if (!user) {
        // Audit logging for failed attempts
        await userService.logAuditEvent(
          'unknown',
          'LOGIN_FAILED',
          'user',
          null,
          { reason: 'invalid_credentials' },
          req.ip || 'unknown'
        );

        res.status(AUTH_ERRORS.INVALID_CREDENTIALS.statusCode).json({
          success: false,
          error: AUTH_ERRORS.INVALID_CREDENTIALS.message,
        });
        return;
      }

      // Create token pair
      const tokens = tokenService.createTokenPair(user.id, user.email, user.role);

      // Calculate expiry for refresh token (7 days from now)
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Save refresh token hash to database
      await userService.saveRefreshToken(user.id, tokens.refreshTokenHash, refreshTokenExpiry);

      // Set HTTPOnly cookie with refresh token (secure in production)
      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/auth',
      });

      // Also set access token in cookie for frontend to use (can be read by JS)
      res.cookie('access_token', tokens.accessToken, {
        httpOnly: false, // Allow JS to read for Widget Federation
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 5 * 60 * 1000, // 5 minutes
        path: '/',
      });

      // Audit log successful login
      await userService.logAuditEvent(
        user.id,
        'LOGIN_SUCCESS',
        'user',
        user.id,
        { method: 'password' },
        req.ip || 'unknown'
      );

      // Return response (never include refresh token in body)
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(AUTH_ERRORS.INTERNAL_ERROR.statusCode).json({
        success: false,
        error: AUTH_ERRORS.INTERNAL_ERROR.message,
      });
    }
  });

  /**
   * POST /auth/signup
   * Register a new user
   * Sets HTTPOnly cookie with refresh token
   * Returns access token in response
   */
  router.post('/signup', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName, role } = req.body as SignupRequest;

      // Validate input
      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          error: 'Email, password, firstName, and lastName are required',
        });
        return;
      }

      // Validate password strength (minimum requirements)
      if (password.length < 8) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters',
        });
        return;
      }

      // Check for existing user
      const existing = await userService.findByEmail(email);
      if (existing) {
        res.status(AUTH_ERRORS.USER_EXISTS.statusCode).json({
          success: false,
          error: AUTH_ERRORS.USER_EXISTS.message,
        });
        return;
      }

      // Create user
      const user = await userService.create(email, password, firstName, lastName, role || 'student');

      // Create token pair
      const tokens = tokenService.createTokenPair(user.id, user.email, user.role);

      // Calculate expiry for refresh token (7 days from now)
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Save refresh token hash
      await userService.saveRefreshToken(user.id, tokens.refreshTokenHash, refreshTokenExpiry);

      // Set HTTPOnly cookie with refresh token
      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/auth',
      });

      // Set access token cookie
      res.cookie('access_token', tokens.accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 5 * 60 * 1000,
        path: '/',
      });

      // Audit log
      await userService.logAuditEvent(
        user.id,
        'USER_CREATED',
        'user',
        user.id,
        { via: 'signup' },
        req.ip || 'unknown'
      );

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(AUTH_ERRORS.INTERNAL_ERROR.statusCode).json({
        success: false,
        error: AUTH_ERRORS.INTERNAL_ERROR.message,
      });
    }
  });

  /**
   * POST /auth/refresh
   * Refresh the access token using refresh token
   * Requires valid refresh token in HTTPOnly cookie
   * Returns new access token (and new refresh token in cookie)
   */
  router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        res.status(AUTH_ERRORS.UNAUTHORIZED.statusCode).json({
          success: false,
          error: 'Refresh token not found',
        });
        return;
      }

      // Verify refresh token
      const result = tokenService.verifyRefreshToken(refreshToken);

      if (!result.valid || !result.payload) {
        res.status(AUTH_ERRORS.INVALID_TOKEN.statusCode).json({
          success: false,
          error: AUTH_ERRORS.INVALID_TOKEN.message,
        });
        return;
      }

      // Verify refresh token exists in database and hasn't been revoked
      const tokenHash = tokenService.hashToken(refreshToken);
      const tokenExists = await userService.verifyRefreshToken(result.payload.userId, tokenHash);

      if (!tokenExists) {
        res.status(AUTH_ERRORS.INVALID_TOKEN.statusCode).json({
          success: false,
          error: 'Refresh token has been revoked',
        });
        return;
      }

      // Get user
      const user = await userService.findById(result.payload.userId);

      if (!user) {
        res.status(AUTH_ERRORS.USER_NOT_FOUND.statusCode).json({
          success: false,
          error: AUTH_ERRORS.USER_NOT_FOUND.message,
        });
        return;
      }

      // Create new token pair (rotate refresh token)
      const newTokens = tokenService.createTokenPair(user.id, user.email, user.role);

      // Revoke old refresh token
      await userService.revokeRefreshToken(tokenHash);

      // Save new refresh token
      const newRefreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await userService.saveRefreshToken(user.id, newTokens.refreshTokenHash, newRefreshTokenExpiry);

      // Set new refresh token cookie
      res.cookie('refresh_token', newTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/auth',
      });

      // Set new access token cookie
      res.cookie('access_token', newTokens.accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 5 * 60 * 1000,
        path: '/',
      });

      // Audit log
      await userService.logAuditEvent(
        user.id,
        'TOKEN_REFRESH',
        'auth',
        null,
        {},
        req.ip || 'unknown'
      );

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
        accessToken: newTokens.accessToken,
      });
    } catch (error) {
      console.error('Refresh error:', error);
      res.status(AUTH_ERRORS.INTERNAL_ERROR.statusCode).json({
        success: false,
        error: AUTH_ERRORS.INTERNAL_ERROR.message,
      });
    }
  });

  /**
   * POST /auth/logout
   * Logout: revoke all refresh tokens for user
   * Requires authentication
   */
  router.post('/logout', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(AUTH_ERRORS.UNAUTHORIZED.statusCode).json({
          success: false,
          error: AUTH_ERRORS.UNAUTHORIZED.message,
        });
        return;
      }

      // Revoke all refresh tokens (logout from all devices)
      await userService.revokeAllRefreshTokens(req.user.userId);

      // Clear cookies
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      // Audit log
      await userService.logAuditEvent(
        req.user.userId,
        'LOGOUT',
        'auth',
        null,
        { allDevices: true },
        req.ip || 'unknown'
      );

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(AUTH_ERRORS.INTERNAL_ERROR.statusCode).json({
        success: false,
        error: AUTH_ERRORS.INTERNAL_ERROR.message,
      });
    }
  });

  /**
   * GET /auth/me
   * Get current user profile
   * Requires authentication
   */
  router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(AUTH_ERRORS.UNAUTHORIZED.statusCode).json({
          success: false,
          error: AUTH_ERRORS.UNAUTHORIZED.message,
        });
        return;
      }

      const user = await userService.findById(req.user.userId);

      if (!user) {
        res.status(AUTH_ERRORS.USER_NOT_FOUND.statusCode).json({
          success: false,
          error: AUTH_ERRORS.USER_NOT_FOUND.message,
        });
        return;
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(AUTH_ERRORS.INTERNAL_ERROR.statusCode).json({
        success: false,
        error: AUTH_ERRORS.INTERNAL_ERROR.message,
      });
    }
  });

  return router;
}
