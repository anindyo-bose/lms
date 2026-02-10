/**
 * API Type Definitions
 */

export interface Course {
  id: string;
  educatorId: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number; // in cents for precision (e.g., 9999 = $99.99)
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: string; // HTML content
  videoUrl?: string; // Optional video URL
  duration: number; // minutes
  order: number; // Position in course
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface LessonProgress {
  id: string;
  studentId: string;
  lessonId: string;
  completionPercentage: number; // 0-100
  timeSpent: number; // seconds
  bookmark?: number; // video timestamp in seconds
  completedAt: Date | null;
  updatedAt: Date;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: Date;
  completedAt: Date | null;
  certificateUrl?: string;
}

export interface CreateCoursePayload {
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  published?: boolean;
}

export interface CreateLessonPayload {
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  duration: number;
  order?: number;
}

export interface UpdateLessonPayload {
  title?: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order?: number;
  published?: boolean;
}

export interface UpdateProgressPayload {
  completionPercentage: number;
  timeSpent?: number;
  bookmark?: number;
  completed?: boolean;
}

export const API_ERRORS = {
  COURSE_NOT_FOUND: {
    code: 'COURSE_NOT_FOUND',
    message: 'Course not found',
    statusCode: 404,
  },
  LESSON_NOT_FOUND: {
    code: 'LESSON_NOT_FOUND',
    message: 'Lesson not found',
    statusCode: 404,
  },
  NOT_ENROLLED: {
    code: 'NOT_ENROLLED',
    message: 'Not enrolled in this course',
    statusCode: 403,
  },
  NOT_COURSE_OWNER: {
    code: 'NOT_COURSE_OWNER',
    message: 'Only course owner can modify',
    statusCode: 403,
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    statusCode: 500,
  },
};
