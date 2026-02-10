/**
 * Course Routes
 * GET    /api/courses         - List courses
 * GET    /api/courses/:id     - Get course details
 * POST   /api/courses         - Create course (educator)
 * PUT    /api/courses/:id     - Update course (educator)
 * DELETE /api/courses/:id     - Delete course (educator)
 * POST   /api/courses/:id/enroll - Enroll in course (student)
 * GET    /api/courses/:id/enrolled - Check enrollment
 * GET    /api/my-courses      - Get my enrolled courses (student)
 */

import { Router, Request, Response } from 'express';
import { CourseService } from '../services/courseService';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth';
import { API_ERRORS } from '../types/index';
import { Pool } from 'pg';

export function createCourseRouter(pool: Pool): Router {
  const router = Router();
  const courseService = new CourseService(pool);

  /**
   * GET /api/courses
   * List courses - published only for public, all for admin
   */
  router.get('/courses', optionalAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, level } = req.query;
      
      // Admin/super_admin can see all courses
      const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');

      const courses = await courseService.getCourses({
        category: category as string | undefined,
        level: level as string | undefined,
        publishedOnly: !isAdmin,
      });

      res.json({
        success: true,
        data: courses,
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({
        success: false,
        error: API_ERRORS.INTERNAL_ERROR.message,
      });
    }
  });

  /**
   * GET /api/courses/:id
   * Get course details
   */
  router.get('/courses/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const course = await courseService.getCourse(id);

      if (!course) {
        res.status(404).json({
          success: false,
          error: API_ERRORS.COURSE_NOT_FOUND.message,
        });
        return;
      }

      // If not published and user is not educator, deny access
      if (!course.published && (!req.user || (req.user.role !== 'educator' && req.user.role !== 'admin' && req.user.role !== 'super_admin'))) {
        res.status(404).json({
          success: false,
          error: API_ERRORS.COURSE_NOT_FOUND.message,
        });
        return;
      }

      // If not published and user is educator, check if they own it
      if (!course.published && req.user && req.user.role === 'educator') {
        if (course.educatorId !== req.user.userId) {
          res.status(403).json({
            success: false,
            error: API_ERRORS.NOT_COURSE_OWNER.message,
          });
          return;
        }
      }

      res.json({
        success: true,
        data: course,
      });
    } catch (error) {
      console.error('Error fetching course:', error);
      res.status(500).json({
        success: false,
        error: API_ERRORS.INTERNAL_ERROR.message,
      });
    }
  });

  /**
   * POST /api/courses
   * Create course (educator only)
   */
  router.post('/courses', requireAuth, requireRole('educator', 'admin'), async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const { title, description, imageUrl, image_url, price, category, level, difficulty_level, is_free } = req.body;
      const actualLevel = level || difficulty_level;
      const actualImageUrl = imageUrl || image_url || '';
      const actualPrice = is_free ? 0 : (price || 0);

      if (!title) {
        res.status(400).json({
          success: false,
          error: 'Title is required',
        });
        return;
      }

      const course = await courseService.createCourse(req.user.userId, {
        title,
        description: description || '',
        imageUrl: actualImageUrl,
        price: actualPrice,
        category: category || 'General',
        level: actualLevel || 'beginner',
      });

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error) {
      console.error('Error creating course:', error);
      res.status(500).json({
        success: false,
        error: API_ERRORS.INTERNAL_ERROR.message,
      });
    }
  });

  /**
   * PUT /api/courses/:id
   * Update course (educator only, must be owner)
   */
  router.put(
    '/courses/:id',
    requireAuth,
    requireRole('educator', 'admin'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: 'Unauthorized',
          });
          return;
        }

        const { id } = req.params;
        const course = await courseService.getCourse(id);

        if (!course) {
          res.status(404).json({
            success: false,
            error: API_ERRORS.COURSE_NOT_FOUND.message,
          });
          return;
        }

        // Check ownership
        if (course.educatorId !== req.user.userId && req.user.role !== 'admin') {
          res.status(403).json({
            success: false,
            error: API_ERRORS.NOT_COURSE_OWNER.message,
          });
          return;
        }

        const updatedCourse = await courseService.updateCourse(id, req.body);

        res.json({
          success: true,
          data: updatedCourse,
        });
      } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({
          success: false,
          error: API_ERRORS.INTERNAL_ERROR.message,
        });
      }
    }
  );

  /**
   * DELETE /api/courses/:id
   * Delete course (educator only, must be owner)
   */
  router.delete(
    '/courses/:id',
    requireAuth,
    requireRole('educator', 'admin'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: 'Unauthorized',
          });
          return;
        }

        const { id } = req.params;
        const course = await courseService.getCourse(id);

        if (!course) {
          res.status(404).json({
            success: false,
            error: API_ERRORS.COURSE_NOT_FOUND.message,
          });
          return;
        }

        // Check ownership
        if (course.educatorId !== req.user.userId && req.user.role !== 'admin') {
          res.status(403).json({
            success: false,
            error: API_ERRORS.NOT_COURSE_OWNER.message,
          });
          return;
        }

        await courseService.deleteCourse(id);

        res.json({
          success: true,
          message: 'Course deleted',
        });
      } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({
          success: false,
          error: API_ERRORS.INTERNAL_ERROR.message,
        });
      }
    }
  );

  /**
   * POST /api/courses/:id/enroll
   * Enroll in course (student)
   */
  router.post('/courses/:id/enroll', requireAuth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;
      const course = await courseService.getCourse(id);

      if (!course || !course.published) {
        res.status(404).json({
          success: false,
          error: API_ERRORS.COURSE_NOT_FOUND.message,
        });
        return;
      }

      const enrollment = await courseService.enrollStudent(req.user.userId, id);

      res.status(201).json({
        success: true,
        data: enrollment,
      });
    } catch (error) {
      console.error('Error enrolling student:', error);
      res.status(500).json({
        success: false,
        error: API_ERRORS.INTERNAL_ERROR.message,
      });
    }
  });

  /**
   * GET /api/courses/:id/enrolled
   * Check if enrolled in course
   */
  router.get('/courses/:id/enrolled', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;
      const isEnrolled = await courseService.isEnrolled(req.user.userId, id);

      res.json({
        success: true,
        enrolled: isEnrolled,
      });
    } catch (error) {
      console.error('Error checking enrollment:', error);
      res.status(500).json({
        success: false,
        error: API_ERRORS.INTERNAL_ERROR.message,
      });
    }
  });

  /**
   * GET /api/my-courses
   * Get authenticated user's courses
   */
  router.get('/my-courses', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      if (req.user.role === 'educator' || req.user.role === 'admin') {
        // Educators see their created courses
        const courses = await courseService.getEducatorCourses(req.user.userId);
        res.json({
          success: true,
          data: courses,
          type: 'created',
        });
      } else {
        // Students see enrolled courses
        const courses = await courseService.getStudentCourses(req.user.userId);
        res.json({
          success: true,
          data: courses,
          type: 'enrolled',
        });
      }
    } catch (error) {
      console.error('Error fetching user courses:', error);
      res.status(500).json({
        success: false,
        error: API_ERRORS.INTERNAL_ERROR.message,
      });
    }
  });

  return router;
}
