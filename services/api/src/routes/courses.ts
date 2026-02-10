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
import { requireAuth, requireRole } from '../middleware/auth';
import { API_ERRORS } from '../types/index';
import { Pool } from 'pg';

export function createCourseRouter(pool: Pool): Router {
  const router = Router();
  const courseService = new CourseService(pool);

  /**
   * GET /api/courses
   * List all published courses with optional filters
   */
  router.get('/courses', async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, level } = req.query;

      const courses = await courseService.getCourses({
        category: category as string | undefined,
        level: level as string | undefined,
        publishedOnly: true,
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
  router.get('/courses/:id', async (req: Request, res: Response): Promise<void> => {
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
      if (!course.published && (!req.user || (req.user.role !== 'educator' && req.user.role !== 'admin'))) {
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

      const { title, description, imageUrl, price, category, level } = req.body;

      if (!title || !description || !imageUrl || price === undefined || !category || !level) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
        return;
      }

      const course = await courseService.createCourse(req.user.userId, {
        title,
        description,
        imageUrl,
        price,
        category,
        level,
      });

      res.status(201).json({
        success: true,
        data: course,
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
