/**
 * CourseService: Course database operations
 * Handles CRUD operations for courses and enrollments
 */

import { Pool } from 'pg';
import { Course, Enrollment, CreateCoursePayload, UpdateCoursePayload } from '../types/index';
import crypto from 'crypto';

export class CourseService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Get all courses (with optional filtering)
   */
  async getCourses(filters?: {
    category?: string;
    level?: string;
    publishedOnly?: boolean;
  }): Promise<Course[]> {
    try {
      let query = `
        SELECT 
          id, educator_id as "educatorId", title, description, 
          image_url as "imageUrl", price, category, difficulty_level as "level", is_published as "published",
          created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt"
        FROM courses
        WHERE deleted_at IS NULL
      `;
      const params: any[] = [];
      let paramCount = 1;

      if (filters?.publishedOnly) {
        query += ` AND is_published = true`;
      }

      if (filters?.category) {
        query += ` AND category = $${paramCount++}`;
        params.push(filters.category);
      }

      if (filters?.level) {
        query += ` AND difficulty_level = $${paramCount++}`;
        params.push(filters.level);
      }

      query += ' ORDER BY created_at DESC';

      const result = await this.pool.query(query, params);
      return result.rows as Course[];
    } catch (error) {
      console.error('Error getting courses:', error);
      throw error;
    }
  }

  /**
   * Get course by ID
   */
  async getCourse(courseId: string): Promise<Course | null> {
    try {
      const result = await this.pool.query(
        `SELECT 
          id, educator_id as "educatorId", title, description, 
          image_url as "imageUrl", price, category, difficulty_level as "level", is_published as "published",
          created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt"
        FROM courses
        WHERE id = $1 AND deleted_at IS NULL`,
        [courseId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as Course;
    } catch (error) {
      console.error('Error getting course:', error);
      throw error;
    }
  }

  /**
   * Get educator's courses
   */
  async getEducatorCourses(educatorId: string): Promise<Course[]> {
    try {
      const result = await this.pool.query(
        `SELECT 
          id, educator_id as "educatorId", title, description, 
          image_url as "imageUrl", price, category, difficulty_level as "level", is_published as "published",
          created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt"
        FROM courses
        WHERE educator_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC`,
        [educatorId]
      );

      return result.rows as Course[];
    } catch (error) {
      console.error('Error getting educator courses:', error);
      throw error;
    }
  }

  /**
   * Create a new course
   */
  async createCourse(educatorId: string, payload: CreateCoursePayload): Promise<Course> {
    try {
      const id = crypto.randomUUID();
      const now = new Date();

      const result = await this.pool.query(
        `INSERT INTO courses (
          id, educator_id, title, description, image_url, 
          price, category, difficulty_level, is_published, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING 
          id, educator_id as "educatorId", title, description, 
          image_url as "imageUrl", price, category, difficulty_level as "level", is_published as "published",
          created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt"`,
        [
          id,
          educatorId,
          payload.title,
          payload.description,
          payload.imageUrl,
          payload.price,
          payload.category,
          payload.level,
          false, // Not published by default
          now,
          now,
        ]
      );

      return result.rows[0] as Course;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  /**
   * Update course (educator only)
   */
  async updateCourse(courseId: string, payload: UpdateCoursePayload): Promise<Course | null> {
    try {
      let query = 'UPDATE courses SET ';
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
      if (payload.imageUrl !== undefined) {
        fields.push(`image_url = $${paramCount++}`);
        params.push(payload.imageUrl);
      }
      if (payload.price !== undefined) {
        fields.push(`price = $${paramCount++}`);
        params.push(payload.price);
      }
      if (payload.category !== undefined) {
        fields.push(`category = $${paramCount++}`);
        params.push(payload.category);
      }
      if (payload.level !== undefined) {
        fields.push(`difficulty_level = $${paramCount++}`);
        params.push(payload.level);
      }
      if (payload.published !== undefined) {
        fields.push(`is_published = $${paramCount++}`);
        params.push(payload.published);
      }

      if (fields.length === 0) {
        return this.getCourse(courseId);
      }

      fields.push(`updated_at = $${paramCount++}`);
      params.push(new Date());

      query += fields.join(', ') + ` WHERE id = $${paramCount} AND deleted_at IS NULL`;
      params.push(courseId);

      const result = await this.pool.query(
        query +
          ` RETURNING 
            id, educator_id as "educatorId", title, description, 
            image_url as "imageUrl", price, category, difficulty_level as "level", is_published as "published",
            created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt"`,
        params
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as Course;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  /**
   * Soft delete course
   */
  async deleteCourse(courseId: string): Promise<void> {
    try {
      await this.pool.query(
        'UPDATE courses SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
        [courseId]
      );
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  /**
   * Enroll student in course
   */
  async enrollStudent(studentId: string, courseId: string): Promise<Enrollment> {
    try {
      // Check if already enrolled
      const existing = await this.pool.query(
        'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
        [studentId, courseId]
      );

      if (existing.rows.length > 0) {
        // Return existing enrollment
        const result = await this.pool.query(
          `SELECT 
            id, student_id as "studentId", course_id as "courseId", 
            enrolled_at as "enrolledAt", completed_at as "completedAt",
            certificate_url as "certificateUrl"
          FROM enrollments
          WHERE student_id = $1 AND course_id = $2`,
          [studentId, courseId]
        );
        return result.rows[0] as Enrollment;
      }

      const id = crypto.randomUUID();
      const now = new Date();

      const result = await this.pool.query(
        `INSERT INTO enrollments (id, student_id, course_id, enrolled_at)
        VALUES ($1, $2, $3, $4)
        RETURNING 
          id, student_id as "studentId", course_id as "courseId", 
          enrolled_at as "enrolledAt", completed_at as "completedAt",
          certificate_url as "certificateUrl"`,
        [id, studentId, courseId, now]
      );

      return result.rows[0] as Enrollment;
    } catch (error) {
      console.error('Error enrolling student:', error);
      throw error;
    }
  }

  /**
   * Check if student is enrolled in course
   */
  async isEnrolled(studentId: string, courseId: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
        [studentId, courseId]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking enrollment:', error);
      throw error;
    }
  }

  /**
   * Get student's enrolled courses
   */
  async getStudentCourses(studentId: string): Promise<Array<Course & { enrolledAt: Date }>> {
    try {
      const result = await this.pool.query(
        `SELECT 
          c.id, c.educator_id as "educatorId", c.title, c.description, 
          c.image_url as "imageUrl", c.price, c.category, c.difficulty_level as "level", c.is_published as "published",
          c.created_at as "createdAt", c.updated_at as "updatedAt", c.deleted_at as "deletedAt",
          e.enrolled_at as "enrolledAt"
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = $1 AND c.deleted_at IS NULL
        ORDER BY e.enrolled_at DESC`,
        [studentId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting student courses:', error);
      throw error;
    }
  }
}
