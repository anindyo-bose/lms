/**
 * LessonService: Lesson database operations
 * Handles CRUD operations for lessons and progress tracking
 */

import { Pool } from 'pg';
import { Lesson, LessonProgress, CreateLessonPayload, UpdateLessonPayload, UpdateProgressPayload } from '../types/index';
import crypto from 'crypto';

export class LessonService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Get all lessons for a course
   */
  async getLessons(courseId: string): Promise<Lesson[]> {
    try {
      const result = await this.pool.query(
        `SELECT 
          id, course_id as "courseId", title, description, content,
          video_url as "videoUrl", duration, "order", published,
          created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt"
        FROM lessons
        WHERE course_id = $1 AND deleted_at IS NULL
        ORDER BY "order" ASC`,
        [courseId]
      );

      return result.rows as Lesson[];
    } catch (error) {
      console.error('Error getting lessons:', error);
      throw error;
    }
  }

  /**
   * Get specific lesson
   */
  async getLesson(lessonId: string): Promise<Lesson | null> {
    try {
      const result = await this.pool.query(
        `SELECT 
          id, course_id as "courseId", title, description, content,
          video_url as "videoUrl", duration, "order", published,
          created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt"
        FROM lessons
        WHERE id = $1 AND deleted_at IS NULL`,
        [lessonId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as Lesson;
    } catch (error) {
      console.error('Error getting lesson:', error);
      throw error;
    }
  }

  /**
   * Create a new lesson
   */
  async createLesson(courseId: string, payload: CreateLessonPayload): Promise<Lesson> {
    try {
      // Get max order for this course
      const orderResult = await this.pool.query(
        'SELECT COALESCE(MAX("order"), 0) + 1 as max_order FROM lessons WHERE course_id = $1',
        [courseId]
      );
      const order = payload.order || orderResult.rows[0].max_order;

      const id = crypto.randomUUID();
      const now = new Date();

      const result = await this.pool.query(
        `INSERT INTO lessons (
          id, course_id, title, description, content, video_url, duration, "order", published, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING 
          id, course_id as "courseId", title, description, content,
          video_url as "videoUrl", duration, "order", published,
          created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt"`,
        [id, courseId, payload.title, payload.description, payload.content, payload.videoUrl, payload.duration, order, false, now, now]
      );

      return result.rows[0] as Lesson;
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  }

  /**
   * Update lesson
   */
  async updateLesson(lessonId: string, payload: UpdateLessonPayload): Promise<Lesson | null> {
    try {
      let query = 'UPDATE lessons SET ';
      const params: any[] = [];
      let paramCount = 1;
      const fields: string[] = [];

      if (payload.title !== undefined) {
        fields.push(`title = $${paramCount++}`);
        params.push(payload.title);
      }
      if (payload.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        params.push(payload.description);
      }
      if (payload.content !== undefined) {
        fields.push(`content = $${paramCount++}`);
        params.push(payload.content);
      }
      if (payload.videoUrl !== undefined) {
        fields.push(`video_url = $${paramCount++}`);
        params.push(payload.videoUrl);
      }
      if (payload.duration !== undefined) {
        fields.push(`duration = $${paramCount++}`);
        params.push(payload.duration);
      }
      if (payload.order !== undefined) {
        fields.push(`"order" = $${paramCount++}`);
        params.push(payload.order);
      }
      if (payload.published !== undefined) {
        fields.push(`published = $${paramCount++}`);
        params.push(payload.published);
      }

      if (fields.length === 0) {
        return this.getLesson(lessonId);
      }

      fields.push(`updated_at = $${paramCount++}`);
      params.push(new Date());

      query += fields.join(', ') + ` WHERE id = $${paramCount} AND deleted_at IS NULL`;
      params.push(lessonId);

      const result = await this.pool.query(
        query +
          ` RETURNING 
            id, course_id as "courseId", title, description, content,
            video_url as "videoUrl", duration, "order", published,
            created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt"`,
        params
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as Lesson;
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
  }

  /**
   * Soft delete lesson
   */
  async deleteLesson(lessonId: string): Promise<void> {
    try {
      await this.pool.query(
        'UPDATE lessons SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
        [lessonId]
      );
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  }

  /**
   * Get or create lesson progress
   */
  async getProgress(studentId: string, lessonId: string): Promise<LessonProgress | null> {
    try {
      const result = await this.pool.query(
        `SELECT 
          id, student_id as "studentId", lesson_id as "lessonId",
          completion_percentage as "completionPercentage", time_spent as "timeSpent",
          bookmark, completed_at as "completedAt", updated_at as "updatedAt"
        FROM lesson_progress
        WHERE student_id = $1 AND lesson_id = $2`,
        [studentId, lessonId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as LessonProgress;
    } catch (error) {
      console.error('Error getting progress:', error);
      throw error;
    }
  }

  /**
   * Update lesson progress
   */
  async updateProgress(
    studentId: string,
    lessonId: string,
    payload: UpdateProgressPayload
  ): Promise<LessonProgress> {
    try {
      // Try to get existing progress
      let progress = await this.getProgress(studentId, lessonId);

      if (!progress) {
        // Create new progress record
        const id = crypto.randomUUID();
        const now = new Date();

        const result = await this.pool.query(
          `INSERT INTO lesson_progress (
            id, student_id, lesson_id, completion_percentage, time_spent, bookmark, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING 
            id, student_id as "studentId", lesson_id as "lessonId",
            completion_percentage as "completionPercentage", time_spent as "timeSpent",
            bookmark, completed_at as "completedAt", updated_at as "updatedAt"`,
          [
            id,
            studentId,
            lessonId,
            payload.completionPercentage,
            payload.timeSpent || 0,
            payload.bookmark || null,
            now,
          ]
        );

        return result.rows[0] as LessonProgress;
      } else {
        // Update existing progress
        const completedAt =
          payload.completed || payload.completionPercentage >= 100 ? new Date() : progress.completedAt;

        const result = await this.pool.query(
          `UPDATE lesson_progress
          SET 
            completion_percentage = $1,
            time_spent = $2,
            bookmark = $3,
            completed_at = $4,
            updated_at = $5
          WHERE student_id = $6 AND lesson_id = $7
          RETURNING 
            id, student_id as "studentId", lesson_id as "lessonId",
            completion_percentage as "completionPercentage", time_spent as "timeSpent",
            bookmark, completed_at as "completedAt", updated_at as "updatedAt"`,
          [
            payload.completionPercentage,
            payload.timeSpent || progress.timeSpent,
            payload.bookmark !== undefined ? payload.bookmark : progress.bookmark,
            completedAt,
            new Date(),
            studentId,
            lessonId,
          ]
        );

        return result.rows[0] as LessonProgress;
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }

  /**
   * Get course progress for student
   */
  async getCourseProgress(studentId: string, courseId: string): Promise<{
    lessonsCompleted: number;
    totalLessons: number;
    averageCompletion: number;
    allLessonsCompleted: boolean;
  }> {
    try {
      const result = await this.pool.query(
        `SELECT 
          COUNT(DISTINCT l.id) as "totalLessons",
          COUNT(DISTINCT CASE WHEN lp.completion_percentage >= 100 THEN l.id END) as "lessonsCompleted",
          ROUND(AVG(COALESCE(lp.completion_percentage, 0))::numeric, 2)::int as "averageCompletion"
        FROM lessons l
        LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.student_id = $1
        WHERE l.course_id = $2 AND l.deleted_at IS NULL`,
        [studentId, courseId]
      );

      const { totalLessons, lessonsCompleted, averageCompletion } = result.rows[0];

      return {
        lessonsCompleted,
        totalLessons,
        averageCompletion,
        allLessonsCompleted: lessonsCompleted === totalLessons && totalLessons > 0,
      };
    } catch (error) {
      console.error('Error getting course progress:', error);
      throw error;
    }
  }
}
