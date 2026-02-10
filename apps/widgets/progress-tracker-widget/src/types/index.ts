/**
 * Progress Types
 */

export interface LearningProgress {
  userId: string;
  overallCompletion: number;
  totalCoursesEnrolled: number;
  coursesCompleted: number;
  coursesInProgress: number;
  totalTimeSpent: number; // seconds
  currentStreak: number; // days
  longestStreak: number;
  lastActiveAt: Date;
  achievements: Achievement[];
  courseProgress: CourseProgressDetail[];
}

export interface CourseProgressDetail {
  courseId: string;
  courseTitle: string;
  courseImage?: string;
  enrolledAt: Date;
  completionPercentage: number;
  lessonsCompleted: number;
  totalLessons: number;
  quizzesPassed: number;
  totalQuizzes: number;
  timeSpent: number; // seconds
  lastAccessedAt: Date;
  completedAt?: Date;
}

export interface Achievement {
  id: string;
  type: 'course_complete' | 'streak' | 'quiz_master' | 'first_course' | 'speed_learner';
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
  metadata?: Record<string, any>;
}

export interface LearningActivity {
  id: string;
  userId: string;
  type: 'lesson_complete' | 'quiz_passed' | 'course_enrolled' | 'course_complete' | 'streak_milestone';
  title: string;
  description: string;
  courseId?: string;
  lessonId?: string;
  quizId?: string;
  createdAt: Date;
}

export interface WeeklyStats {
  week: string; // ISO week format
  lessonsCompleted: number;
  quizzesPassed: number;
  timeSpent: number;
}
