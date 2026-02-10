/**
 * Progress Service - Database operations for learning progress and analytics
 */

import { Pool } from 'pg';

// Types
interface LearningProgress {
  userId: string;
  overallCompletion: number;
  totalCoursesEnrolled: number;
  coursesCompleted: number;
  coursesInProgress: number;
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveAt: Date;
  achievements: Achievement[];
  courseProgress: CourseProgressDetail[];
}

interface CourseProgressDetail {
  courseId: string;
  courseTitle: string;
  courseImage?: string;
  enrolledAt: Date;
  completionPercentage: number;
  lessonsCompleted: number;
  totalLessons: number;
  quizzesPassed: number;
  totalQuizzes: number;
  timeSpent: number;
  lastAccessedAt: Date;
  completedAt?: Date;
}

interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
  metadata?: Record<string, any>;
}

interface LearningActivity {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  courseId?: string;
  lessonId?: string;
  quizId?: string;
  createdAt: Date;
}

interface WeeklyStats {
  week: string;
  lessonsCompleted: number;
  quizzesPassed: number;
  timeSpent: number;
}

// Database pool
let pool: Pool;

export function initProgressService(dbPool: Pool): void {
  pool = dbPool;
}

/**
 * Get overall learning progress for a user
 */
export async function getOverallProgress(userId: string): Promise<LearningProgress> {
  // Get enrollments
  const enrollmentsResult = await pool.query(
    `SELECT e.*, c.title, c.thumbnail_url
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     WHERE e.user_id = $1 AND c.deleted_at IS NULL
     ORDER BY e.enrolled_at DESC`,
    [userId]
  );

  const enrollments = enrollmentsResult.rows;
  const totalCoursesEnrolled = enrollments.length;

  // Get course progress for each enrollment
  const courseProgress: CourseProgressDetail[] = [];
  let totalTimeSpent = 0;
  let coursesCompleted = 0;
  let coursesInProgress = 0;
  let totalOverallCompletion = 0;

  for (const enrollment of enrollments) {
    const courseId = enrollment.course_id;

    // Get lesson count and progress
    const lessonResult = await pool.query(
      `SELECT 
         COUNT(l.id) as total_lessons,
         COUNT(lp.completed_at) as completed_lessons,
         COALESCE(SUM(lp.time_spent_seconds), 0) as time_spent
       FROM lessons l
       LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = $1
       WHERE l.course_id = $2 AND l.deleted_at IS NULL AND l.published = true`,
      [userId, courseId]
    );

    // Get quiz count and passed
    const quizResult = await pool.query(
      `SELECT 
         COUNT(DISTINCT q.id) as total_quizzes,
         COUNT(DISTINCT CASE WHEN qa.passed THEN q.id END) as quizzes_passed
       FROM quizzes q
       JOIN lessons l ON q.lesson_id = l.id
       LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.user_id = $1
       WHERE l.course_id = $2 AND q.deleted_at IS NULL`,
      [userId, courseId]
    );

    // Get last accessed
    const lastAccessResult = await pool.query(
      `SELECT MAX(lp.updated_at) as last_accessed
       FROM lesson_progress lp
       JOIN lessons l ON lp.lesson_id = l.id
       WHERE l.course_id = $1 AND lp.user_id = $2`,
      [courseId, userId]
    );

    const totalLessons = parseInt(lessonResult.rows[0].total_lessons, 10);
    const lessonsCompleted = parseInt(lessonResult.rows[0].completed_lessons, 10);
    const timeSpent = parseInt(lessonResult.rows[0].time_spent, 10);
    const totalQuizzes = parseInt(quizResult.rows[0].total_quizzes, 10);
    const quizzesPassed = parseInt(quizResult.rows[0].quizzes_passed, 10);

    const completionPercentage =
      totalLessons > 0 ? (lessonsCompleted / totalLessons) * 100 : 0;

    totalTimeSpent += timeSpent;
    totalOverallCompletion += completionPercentage;

    const isComplete = completionPercentage >= 100;
    if (isComplete) {
      coursesCompleted++;
    } else if (lessonsCompleted > 0) {
      coursesInProgress++;
    }

    courseProgress.push({
      courseId,
      courseTitle: enrollment.title,
      courseImage: enrollment.thumbnail_url,
      enrolledAt: enrollment.enrolled_at,
      completionPercentage,
      lessonsCompleted,
      totalLessons,
      quizzesPassed,
      totalQuizzes,
      timeSpent,
      lastAccessedAt: lastAccessResult.rows[0]?.last_accessed || enrollment.enrolled_at,
      completedAt: isComplete && enrollment.completed_at ? enrollment.completed_at : undefined,
    });
  }

  // Calculate overall completion
  const overallCompletion =
    totalCoursesEnrolled > 0 ? totalOverallCompletion / totalCoursesEnrolled : 0;

  // Get streak data (simplified - would need a proper streak tracking table)
  const streakResult = await pool.query(
    `SELECT COUNT(DISTINCT DATE(lp.updated_at)) as active_days
     FROM lesson_progress lp
     WHERE lp.user_id = $1 AND lp.updated_at > NOW() - INTERVAL '30 days'`,
    [userId]
  );

  const currentStreak = Math.min(parseInt(streakResult.rows[0].active_days, 10), 30);
  const longestStreak = currentStreak; // Simplified

  // Get last active
  const lastActiveResult = await pool.query(
    `SELECT MAX(updated_at) as last_active
     FROM lesson_progress WHERE user_id = $1`,
    [userId]
  );

  // Get achievements
  const achievementsResult = await pool.query(
    `SELECT * FROM user_achievements
     WHERE user_id = $1
     ORDER BY earned_at DESC`,
    [userId]
  );

  const achievements: Achievement[] = achievementsResult.rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    icon: row.icon,
    earnedAt: row.earned_at,
    metadata: row.metadata,
  }));

  return {
    userId,
    overallCompletion,
    totalCoursesEnrolled,
    coursesCompleted,
    coursesInProgress,
    totalTimeSpent,
    currentStreak,
    longestStreak,
    lastActiveAt: lastActiveResult.rows[0]?.last_active || new Date(),
    achievements,
    courseProgress,
  };
}

/**
 * Get recent learning activities
 */
export async function getRecentActivities(
  userId: string,
  limit = 10
): Promise<LearningActivity[]> {
  const result = await pool.query(
    `SELECT * FROM learning_activities
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    description: row.description,
    courseId: row.course_id,
    lessonId: row.lesson_id,
    quizId: row.quiz_id,
    createdAt: row.created_at,
  }));
}

/**
 * Get weekly learning stats
 */
export async function getWeeklyStats(
  userId: string,
  weeks = 8
): Promise<WeeklyStats[]> {
  const result = await pool.query(
    `SELECT 
       DATE_TRUNC('week', lp.updated_at) as week,
       COUNT(DISTINCT CASE WHEN lp.completed_at IS NOT NULL THEN lp.lesson_id END) as lessons_completed,
       COUNT(DISTINCT CASE WHEN qa.passed THEN qa.id END) as quizzes_passed,
       COALESCE(SUM(lp.time_spent_seconds), 0) as time_spent
     FROM lesson_progress lp
     LEFT JOIN quiz_attempts qa ON qa.user_id = lp.user_id 
       AND DATE_TRUNC('week', qa.completed_at) = DATE_TRUNC('week', lp.updated_at)
     WHERE lp.user_id = $1 AND lp.updated_at > NOW() - INTERVAL '${weeks} weeks'
     GROUP BY DATE_TRUNC('week', lp.updated_at)
     ORDER BY week DESC
     LIMIT $2`,
    [userId, weeks]
  );

  return result.rows.map((row) => ({
    week: row.week.toISOString(),
    lessonsCompleted: parseInt(row.lessons_completed, 10),
    quizzesPassed: parseInt(row.quizzes_passed, 10),
    timeSpent: parseInt(row.time_spent, 10),
  }));
}

/**
 * Get progress for a specific course
 */
export async function getCourseProgress(
  userId: string,
  courseId: string
): Promise<CourseProgressDetail | null> {
  const progress = await getOverallProgress(userId);
  return progress.courseProgress.find((c) => c.courseId === courseId) || null;
}

/**
 * Record a learning activity
 */
export async function recordActivity(
  userId: string,
  type: string,
  title: string,
  description: string,
  courseId?: string,
  lessonId?: string,
  quizId?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO learning_activities (user_id, type, title, description, course_id, lesson_id, quiz_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, type, title, description, courseId, lessonId, quizId]
  );
}
