/**
 * Admin Routes
 * GET /api/admin/stats - Get platform statistics
 * GET /api/admin/users - List all users
 * POST /api/admin/users - Create a new user
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export function createAdminRouter(pool: Pool): Router {
  const router = Router();

  /**
   * GET /api/admin/stats
   * Get platform statistics for admin dashboard
   */
  router.get(
    '/admin/stats',
    requireAuth,
    requireRole('admin', 'super_admin'),
    async (_req: Request, res: Response): Promise<void> => {
      try {
        // Get total users count
        const usersResult = await pool.query(
          'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'
        );
        const totalUsers = parseInt(usersResult.rows[0].count, 10);

        // Get total courses count
        const coursesResult = await pool.query(
          'SELECT COUNT(*) as count FROM courses WHERE deleted_at IS NULL'
        );
        const totalCourses = parseInt(coursesResult.rows[0].count, 10);

        // Get total enrollments count
        const enrollmentsResult = await pool.query(
          'SELECT COUNT(*) as count FROM enrollments'
        );
        const totalEnrollments = parseInt(enrollmentsResult.rows[0].count, 10);

        // Get total revenue (sum of successful payments) - handle missing table
        let totalRevenue = 0;
        try {
          const revenueResult = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'`
          );
          totalRevenue = parseInt(revenueResult.rows[0].total, 10);
        } catch {
          // payments table may not exist yet
          totalRevenue = 0;
        }

        res.json({
          success: true,
          stats: {
            totalUsers,
            totalCourses,
            totalEnrollments,
            totalRevenue,
          },
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch statistics',
        });
      }
    }
  );

  /**
   * GET /api/admin/users
   * List all users (admin only)
   */
  router.get(
    '/admin/users',
    requireAuth,
    requireRole('admin', 'super_admin'),
    async (_req: Request, res: Response): Promise<void> => {
      try {
        const result = await pool.query(
          `SELECT id, email, first_name as "firstName", last_name as "lastName", 
                  role, created_at as "createdAt"
           FROM users 
           WHERE deleted_at IS NULL 
           ORDER BY created_at DESC`
        );

        res.json({
          success: true,
          users: result.rows,
        });
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch users',
        });
      }
    }
  );

  /**
   * POST /api/admin/users
   * Create a new user (admin only)
   */
  router.post(
    '/admin/users',
    requireAuth,
    requireRole('admin', 'super_admin'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { email, firstName, lastName, role, password } = req.body;

        // Validate required fields
        if (!email || !firstName || !lastName || !role || !password) {
          res.status(400).json({
            success: false,
            error: 'Missing required fields: email, firstName, lastName, role, password',
          });
          return;
        }

        // Validate role based on current user's permissions
        const currentUserRole = req.user?.role;
        const allowedRolesForAdmin = ['student', 'educator'];
        const allowedRolesForSuperAdmin = ['student', 'educator', 'admin', 'super_admin'];
        
        const allowedRoles = currentUserRole === 'super_admin' 
          ? allowedRolesForSuperAdmin 
          : allowedRolesForAdmin;
        
        if (!allowedRoles.includes(role)) {
          res.status(403).json({
            success: false,
            error: currentUserRole === 'super_admin'
              ? 'Invalid role. Must be one of: student, educator, admin, super_admin'
              : 'You can only create student or educator accounts',
          });
          return;
        }

        // Check if user already exists
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
          [email]
        );

        if (existingUser.rows.length > 0) {
          res.status(409).json({
            success: false,
            error: 'User with this email already exists',
          });
          return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        // Create user
        const result = await pool.query(
          `INSERT INTO users (id, email, password_hash, first_name, last_name, role, must_change_password, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
           RETURNING id, email, first_name as "firstName", last_name as "lastName", role, created_at as "createdAt"`,
          [userId, email, passwordHash, firstName, lastName, role]
        );

        res.status(201).json({
          success: true,
          user: result.rows[0],
        });
      } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create user',
        });
      }
    }
  );

  return router;
}
