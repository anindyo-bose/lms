/**
 * Progress Tracker Widget Contract
 */

export interface IProgressWidget {
  getCourseProgress(courseId: string): Promise<CourseProgress>;
  getAllProgressSummary(): Promise<CourseSummary[]>;
  getLessonProgress(courseId: string, lessonId: string): Promise<LessonProgressDetail>;
  getQuizHistory(lessonId: string): Promise<QuizHistoryItem[]>;
  getCertificates(): Promise<Certificate[]>;
  onProgressUpdate(callback: (progress: CourseProgress) => void): () => void;
}

export interface CourseProgress {
  courseId: string;
  courseName: string;
  completionPercentage: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  averageQuizScore: number | null;
  timeSpentHours: number;
  lastAccessedAt: string | null;
  certificateEarned: boolean;
  certificateEarnedAt?: string;
}

export interface CourseSummary {
  courseId: string;
  courseName: string;
  completionPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed';
  enrolledAt: string;
}

export interface LessonProgressDetail {
  lessonId: string;
  lessonName: string;
  completionPercentage: number;
  timeSpentSeconds: number;
  completedAt?: string;
  bookmarkAt?: number;
}

export interface QuizHistoryItem {
  attemptId: string;
  date: string;
  score: number;
  passed: boolean;
  feedback?: string;
}

export interface Certificate {
  id: string;
  courseId: string;
  courseName: string;
  earnedAt: string;
  validUntil?: string;
  url: string;
}

export class ProgressError extends Error {
  constructor(
    public code: 'NOT_FOUND' | 'UNAUTHORIZED',
    message: string
  ) {
    super(message);
    this.name = 'ProgressError';
  }
}
