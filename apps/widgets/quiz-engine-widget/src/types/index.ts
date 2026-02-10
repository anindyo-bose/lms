/**
 * Quiz Types
 */

export interface Quiz {
  id: string;
  lessonId: string;
  courseId: string;
  title: string;
  description: string;
  passingScore: number;
  timeLimit?: number; // minutes
  shuffleQuestions: boolean;
  showResults: boolean;
  maxAttempts?: number;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  quizId: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'multi-select';
  text: string;
  options?: QuestionOption[];
  correctAnswer?: string; // For short-answer
  points: number;
  order: number;
  explanation?: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  passed: boolean;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
  isCorrect?: boolean;
  points: number;
}

export interface QuizResult {
  attemptId: string;
  quizId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeSpent: number; // seconds
  questionResults: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  type: Question['type'];
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  pointsPossible: number;
  explanation?: string;
}

export const API_ERRORS = {
  QUIZ_NOT_FOUND: 'QUIZ_NOT_FOUND',
  MAX_ATTEMPTS_EXCEEDED: 'MAX_ATTEMPTS_EXCEEDED',
  TIME_LIMIT_EXCEEDED: 'TIME_LIMIT_EXCEEDED',
  ALREADY_IN_PROGRESS: 'ALREADY_IN_PROGRESS',
  NOT_ENROLLED: 'NOT_ENROLLED',
} as const;
