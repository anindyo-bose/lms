/**
 * Lesson Routes
 * GET    /api/lessons/:courseId     - Get lessons for course
 * GET    /api/lessons/:id           - Get lesson details
 * POST   /api/lessons/:courseId     - Create lesson (educator)
 * PUT    /api/lessons/:id           - Update lesson (educator)
 * DELETE /api/lessons/:id           - Delete lesson (educator)
 * GET    /api/lessons/:id/progress  - Get lesson progress (enrolled student)
 * POST   /api/lessons/:id/progress  - Update lesson progress (student)
 * GET    /api/courses/:courseId/progress - Get course progress
 */

import { Router, Request, Response } from 'express';
import { LessonService } from '../services/lessonService';
import { CourseService } from '../services/courseService';
import { requireAuth, requireRole } from '../middleware/auth';
import { API_ERRORS } from '../types/index';
import { Pool } from 'pg';

export function createLessonRouter(pool: Pool): Router {
  const router = Router();
  const lessonService = new LessonService(pool);
  const courseService = new CourseService(pool);

  /**
   * GET /api/lessons/:courseId
   * Get lessons for a course
   */
  router.get('/lessons/:courseId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;

      // Verify course exists
      const course = await courseService.getCourse(courseId);
      if (!course) {
        res.status(404).json({
          success: false,
          error: API_ERRORS.COURSE_NOT_FOUND.message,
        });
        return;
      }

      const lessons = await lessonService.getLessons(courseId);

      res.json({
        success: true,
        data: lessons,
      });
    } catch (error) {
      console.error('Error fetching lessons:', error);
      res.status(500).json({
        success: false,
        error: API_ERRORS.INTERNAL_ERROR.message,
      });
    }
  });

  /**
   * GET /api/lessons/detail/:id
   * Get lesson details
   */
  router.get('/lessons/detail/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const lesson = await lessonService.getLesson(id);

      if (!lesson) {
        res.status(404).json({
          success: false,
          error: API_ERRORS.LESSON_NOT_FOUND.message,
        });
        return;
      }

      // Check if user is enrolled (if not published)
      if (!lesson.published && req.user) {
        const isEnrolled = await courseService.isEnrolled(req.user.userId, lesson.courseId);
        if (!isEnrolled && req.user.role !== 'educator' && req.user.role !== 'admin') {
          res.status(403).json({
            success: false,
            error: API_ERRORS.NOT_ENROLLED.message,
          });
          return;
        }
      }

      res.json({
        success: true,
        data: lesson,
      });
    } catch (error) {
      console.error('Error fetching lesson:', error);
      res.status(500).json({
        success: false,
        error: API_ERRORS.INTERNAL_ERROR.message,
      });
    }
  });

  /**
   * POST /api/lessons/:courseId
   * Create lesson (educator only, must be course owner)
   */
  router.post(
    '/lessons/:courseId',
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

        const { courseId } = req.params;

        // Verify course exists and user owns it
        const course = await courseService.getCourse(courseId);
        if (!course) {
          res.status(404).json({
            success: false,
            error: API_ERRORS.COURSE_NOT_FOUND.message,
          });
          return;
        }

        if (course.educatorId !== req.user.userId && req.user.role !== 'admin') {
          res.status(403).json({
            success: false,
            error: API_ERRORS.NOT_COURSE_OWNER.message,
          });
          return;
        }

        const { title, description, content, videoUrl, duration } = req.body;

        if (!title || !description || !content || duration === undefined) {
          res.status(400).json({
            success: false,
            error: 'Missing required fields',
          });
          return;
        }

        const lesson = await lessonService.createLesson(courseId, {
          title,
          description,
          content,
          videoUrl,
          duration,
        });

        res.status(201).json({
          success: true,
          data: lesson,
        });
      } catch (error) {
        console.error('Error creating lesson:', error);
        res.status(500).json({
          success: false,
          error: API_ERRORS.INTERNAL_ERROR.message,
        });
      }
    }
  );

  /**
   * PUT /api/lessons/:id
   * Update lesson (educator only)
   */
  router.put(
    '/lessons/:id',
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
        const lesson = await lessonService.getLesson(id);

        if (!lesson) {
          res.status(404).json({
            success: false,
            error: API_ERRORS.LESSON_NOT_FOUND.message,
          });
          return;
        }

        // Check course ownership
        const course = await courseService.getCourse(lesson.courseId);
        if (!course) {
          res.status(404).json({
            success: false,
            error: API_ERRORS.COURSE_NOT_FOUND.message,
          });
          return;
        }

        if (course.educatorId !== req.user.userId && req.user.role !== 'admin') {
          res.status(403).json({
            success: false,
            error: API_ERRORS.NOT_COURSE_OWNER.message,
          });
          return;
        }

        const updatedLesson = await lessonService.updateLesson(id, req.body);

        res.json({
          success: true,
          data: updatedLesson,
        });
      } catch (error) {
        console.error('Error updating lesson:', error);
        res.status(500).json({
          success: false,
          error: API_ERRORS.INTERNAL_ERROR.message,
        });
      }
    }
  );

  /**
   * DELETE /api/lessons/:id
   * Delete lesson (educator only)
   */
  router.delete(
    '/lessons/:id',
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
        const lesson = await lessonService.getLesson(id);

        if (!lesson) {
          res.status(404).json({
            success: false,
            error: API_ERRORS.LESSON_NOT_FOUND.message,
          });
          return;
        }

        // Check course ownership
        const course = await courseService.getCourse(lesson.courseId);
        if (!course) {
          res.status(404).json({
            success: false,
            error: API_ERRORS.COURSE_NOT_FOUND.message,
          });
          return;
        }

        if (course.educatorId !== req.user.userId && req.user.role !== 'admin') {
          res.status(403).json({
            success: false,
            error: API_ERRORS.NOT_COURSE_OWNER.message,
          });
          return;
        }

        await lessonService.deleteLesson(id);

        res.json({
          success: true,
          message: 'Lesson deleted',
        });
      } catch (error) {
        console.error('Error deleting lesson:', error);
        res.status(500).json({
          success: false,
          error: API_ERRORS.INTERNAL_ERROR.message,
        });
      }
    }
  );

  /**
   * GET /api/lessons/:id/progress
   * Get lesson progress (student only)
   */
  router.get('/lessons/:id/progress', requireAuth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;

      // Get lesson to check course
      const lesson = await lessonService.getLesson(id);
      if (!lesson) {
        res.status(404).json({
          success: false,
          error: API_ERRORS.LESSON_NOT_FOUND.message,
        });
        return;
      }

      // Check enrollment
      const isEnrolled = await courseService.isEnrolled(req.user.userId, lesson.courseId);
      if (!isEnrolled) {
        res.status(403).json({
          success: false,
          error: API_ERRORS.NOT_ENROLLED.message,
        });
        return;
      }

      const progress = await lessonService.getProgress(req.user.userId, id);

      res.json({
        success: true,
        data: progress || {
          completionPercentage: 0,
          timeSpent: 0,
          bookmark: null,
        },
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
      res.status(500).json({
        success: false,
        error: API_ERRORS.INTERNAL_ERROR.message,
      });
    }
  });

  /**
   * POST /api/lessons/:id/progress
   * Update lesson progress (student only)
   */
  router.post('/lessons/:id/progress', requireAuth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;
      const { completionPercentage, timeSpent, bookmark, completed } = req.body;

      // Validate input
      if (completionPercentage === undefined || completionPercentage < 0 || completionPercentage > 100) {
        res.status(400).json({
          success: false,
          error: 'Invalid completion percentage',
        });
        return;
      }

      // Get lesson to check course
      const lesson = await lessonService.getLesson(id);
      if (!lesson) {
        res.status(404).json({
          success: false,
          error: API_ERRORS.LESSON_NOT_FOUND.message,
        });
        return;
      }

      // Check enrollment
      const isEnrolled = await courseService.isEnrolled(req.user.userId, lesson.courseId);
      if (!isEnrolled) {
        res.status(403).json({
          success: false,
          error: API_ERRORS.NOT_ENROLLED.message,
        });
        return;
      }

      const progress = await lessonService.updateProgress(req.user.userId, id, {
        completionPercentage,
        timeSpent,
        bookmark,
        completed,
      });

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      res.status(500).json({
        success: false,
        error: API_ERRORS.INTERNAL_ERROR.message,
      });
    }
  });

  /**
   * GET /api/courses/:courseId/progress
   * Get course progress (student only)
   */
  router.get(
    '/courses/:courseId/progress',
    requireAuth,
    requireRole('student'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: 'Unauthorized',
          });
          return;
        }

        const { courseId } = req.params;

        // Check enrollment
        const isEnrolled = await courseService.isEnrolled(req.user.userId, courseId);
        if (!isEnrolled) {
          res.status(403).json({
            success: false,
            error: API_ERRORS.NOT_ENROLLED.message,
          });
          return;
        }

        const progress = await lessonService.getCourseProgress(req.user.userId, courseId);

        res.json({
          success: true,
          data: progress,
        });
      } catch (error) {
        console.error('Error fetching course progress:', error);
        res.status(500).json({
          success: false,
          error: API_ERRORS.INTERNAL_ERROR.message,
        });
      }
    }
  );

  return router;
}
