/**
 * Progress Routes - Learning analytics endpoints
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import * as progressService from '../services/progressService';

const router = Router();

/**
 * GET /api/progress/overview - Get overall learning progress
 */
router.get('/overview', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    const progress = await progressService.getOverallProgress(userId);

    res.json({ success: true, progress });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch progress',
    });
  }
});

/**
 * GET /api/progress/activities - Get recent learning activities
 */
router.get('/activities', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    const activities = await progressService.getRecentActivities(userId, limit);

    res.json({ success: true, activities });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch activities',
    });
  }
});

/**
 * GET /api/progress/weekly - Get weekly learning stats
 */
router.get('/weekly', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const weeks = parseInt(req.query.weeks as string, 10) || 8;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    const stats = await progressService.getWeeklyStats(userId, weeks);

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get weekly stats error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch weekly stats',
    });
  }
});

/**
 * GET /api/progress/course/:courseId - Get progress for a specific course
 */
router.get('/course/:courseId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { courseId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    const progress = await progressService.getCourseProgress(userId, courseId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Course progress not found',
      });
    }

    res.json({ success: true, progress });
  } catch (error) {
    console.error('Get course progress error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch course progress',
    });
  }
});

export default router;
