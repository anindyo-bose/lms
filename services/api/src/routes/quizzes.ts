/**
 * Quiz Routes - Quiz and attempt endpoints
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import * as quizService from '../services/quizService';

const router = Router();

/**
 * GET /api/quizzes/:id - Get quiz by ID
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const quiz = await quizService.getQuizById(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'QUIZ_NOT_FOUND',
        message: 'Quiz not found',
      });
    }

    // Don't expose correct answers when fetching quiz for taking
    const sanitizedQuiz = {
      ...quiz,
      questions: quiz.questions.map((q) => ({
        ...q,
        correctAnswer: undefined, // Hide correct answer
        options: q.options?.map((o) => ({
          id: o.id,
          text: o.text,
          // Don't include isCorrect
        })),
      })),
    };

    res.json({ success: true, quiz: sanitizedQuiz });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch quiz',
    });
  }
});

/**
 * GET /api/quizzes/lesson/:lessonId - Get quiz by lesson ID
 */
router.get('/lesson/:lessonId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    const quiz = await quizService.getQuizByLessonId(lessonId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'QUIZ_NOT_FOUND',
        message: 'No quiz found for this lesson',
      });
    }

    // Sanitize quiz (hide answers)
    const sanitizedQuiz = {
      ...quiz,
      questions: quiz.questions.map((q) => ({
        ...q,
        correctAnswer: undefined,
        options: q.options?.map((o) => ({
          id: o.id,
          text: o.text,
        })),
      })),
    };

    res.json({ success: true, quiz: sanitizedQuiz });
  } catch (error) {
    console.error('Get quiz by lesson error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch quiz',
    });
  }
});

/**
 * POST /api/quizzes/:id/attempts - Start a new quiz attempt
 */
router.post('/:id/attempts', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id: quizId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    // Get quiz to check max attempts
    const quiz = await quizService.getQuizById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'QUIZ_NOT_FOUND',
        message: 'Quiz not found',
      });
    }

    // Check max attempts
    if (quiz.maxAttempts) {
      const attemptCount = await quizService.getAttemptCount(quizId, userId);
      if (attemptCount >= quiz.maxAttempts) {
        return res.status(403).json({
          success: false,
          error: 'MAX_ATTEMPTS_EXCEEDED',
          message: `Maximum attempts (${quiz.maxAttempts}) exceeded`,
        });
      }
    }

    const attempt = await quizService.createAttempt(quizId, userId);

    res.status(201).json({ success: true, attempt });
  } catch (error) {
    console.error('Create attempt error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to start quiz attempt',
    });
  }
});

/**
 * GET /api/quizzes/:id/attempts - Get user's attempts for a quiz
 */
router.get('/:id/attempts', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id: quizId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    const attempts = await quizService.getUserAttempts(quizId, userId);

    res.json({ success: true, attempts });
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch attempts',
    });
  }
});

/**
 * POST /api/quizzes/attempts/:attemptId/submit - Submit quiz answers
 */
router.post('/attempts/:attemptId/submit', requireAuth, async (req: Request, res: Response) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Answers array is required',
      });
    }

    const result = await quizService.submitQuiz(attemptId, answers);

    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to submit quiz',
    });
  }
});

/**
 * GET /api/quizzes/attempts/:attemptId/result - Get result for an attempt
 */
router.get('/attempts/:attemptId/result', requireAuth, async (req: Request, res: Response) => {
  try {
    const { attemptId } = req.params;
    const result = await quizService.getAttemptResult(attemptId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'ATTEMPT_NOT_FOUND',
        message: 'Attempt not found',
      });
    }

    res.json({ success: true, result });
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch result',
    });
  }
});

export default router;
