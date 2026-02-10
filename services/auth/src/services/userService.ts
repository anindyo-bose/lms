/**
 * UserService: User database operations
 * Handles user lookup, creation, password validation
 */

import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { User, AUTH_ERRORS } from '../types/index';
import crypto from 'crypto';

export class UserService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        'SELECT id, email, first_name as "firstName", last_name as "lastName", role, must_change_password as "mustChangePassword", created_at as "createdAt", updated_at as "updatedAt" FROM users WHERE email = $1 AND deleted_at IS NULL',
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as User;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        'SELECT id, email, first_name as "firstName", last_name as "lastName", role, must_change_password as "mustChangePassword", created_at as "createdAt", updated_at as "updatedAt" FROM users WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as User;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   * Returns the user with hashed password (never expose raw password)
   */
  async create(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'student' | 'educator' | 'admin' = 'student'
  ): Promise<User> {
    try {
      // Check if user already exists
      const existing = await this.findByEmail(email);
      if (existing) {
        throw new Error(AUTH_ERRORS.USER_EXISTS.message);
      }

      // Hash password with bcrypt (10 rounds in production, fewer in tests)
      const hashedPassword = await bcrypt.hash(password, 10);

      const id = crypto.randomUUID();
      const now = new Date();

      const result = await this.pool.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, must_change_password, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, email, first_name as "firstName", last_name as "lastName", role, must_change_password as "mustChangePassword", created_at as "createdAt", updated_at as "updatedAt"`,
        [id, email, hashedPassword, firstName, lastName, role, false, now, now]
      );

      return result.rows[0] as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Verify password against hashed password
   * Returns null if password is incorrect
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        'SELECT id, email, password_hash, first_name as "firstName", last_name as "lastName", role, must_change_password as "mustChangePassword", created_at as "createdAt", updated_at as "updatedAt" FROM users WHERE email = $1 AND deleted_at IS NULL',
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      const passwordHash = user.password_hash;
      delete user.password_hash; // Never return password hash

      // Compare password with hash
      const isValid = await bcrypt.compare(password, passwordHash);

      if (!isValid) {
        return null;
      }

      return user as User;
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.pool.query(
        'UPDATE users SET password_hash = $1, must_change_password = false, updated_at = NOW() WHERE id = $2',
        [hashedPassword, userId]
      );
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Save refresh token hash to database
   */
  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    try {
      const id = crypto.randomUUID();

      await this.pool.query(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [id, userId, tokenHash, expiresAt]
      );
    } catch (error) {
      console.error('Error saving refresh token:', error);
      throw error;
    }
  }

  /**
   * Verify refresh token exists and hasn't expired
   */
  async verifyRefreshToken(userId: string, tokenHash: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `SELECT id FROM refresh_tokens 
         WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW() AND revoked_at IS NULL`,
        [userId, tokenHash]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error verifying refresh token:', error);
      throw error;
    }
  }

  /**
   * Revoke a refresh token
   */
  async revokeRefreshToken(tokenHash: string): Promise<void> {
    try {
      await this.pool.query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
        [tokenHash]
      );
    } catch (error) {
      console.error('Error revoking refresh token:', error);
      throw error;
    }
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    try {
      await this.pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1', [
        userId,
      ]);
    } catch (error) {
      console.error('Error revoking all refresh tokens:', error);
      throw error;
    }
  }

  /**
   * Log audit event
   */
  async logAuditEvent(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string | null,
    changes: Record<string, unknown> | null,
    ipAddress: string
  ): Promise<void> {
    try {
      const id = crypto.randomUUID();

      await this.pool.query(
        `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, changes, ip_address, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [id, userId, action, resourceType, resourceId, JSON.stringify(changes), ipAddress]
      );
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't throw - audit logging should not block operations
    }
  }
}
