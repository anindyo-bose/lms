/**
 * Quiz Engine Widget Contract
 */

export interface IQuizWidget {
  getQuiz(quizId: string): Promise<Quiz | null>;
  getQuizzesForLesson(lessonId: string): Promise<Quiz[]>;
  createQuiz(lessonId: string, data: CreateQuizPayload): Promise<Quiz>;
  updateQuiz(quizId: string, data: UpdateQuizPayload): Promise<Quiz>;
  submitQuizAttempt(quizId: string, answers: QuizAnswer[]): Promise<QuizSubmission>;
  getAttemptHistory(quizId: string): Promise<QuizSubmission[]>;
  getAttempt(attemptId: string): Promise<QuizSubmission | null>;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  timeLimit: number;
  maxAttempts: number;
  passingScore: number;
  questions: QuizQuestion[];
  shuffleQuestions: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  explanation?: string;
}

export interface QuizAnswer {
  questionId: string;
  studentAnswer: string | string[];
  timeToAnswer: number;
}

export interface QuizSubmission {
  id: string;
  studentId: string;
  quizId: string;
  answers: QuizAnswer[];
  score: number;
  passed: boolean;
  submittedAt: string;
  completedIn: number;
}

export interface CreateQuizPayload {
  title: string;
  description: string;
  timeLimit: number;
  maxAttempts: number;
  passingScore: number;
  questions: CreateQuizQuestion[];
  shuffleQuestions?: boolean;
}

export interface CreateQuizQuestion {
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
}

export interface UpdateQuizPayload {
  title?: string;
  description?: string;
  timeLimit?: number;
  maxAttempts?: number;
  passingScore?: number;
  isPublished?: boolean;
}

export class QuizError extends Error {
  constructor(
    public code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'MAX_ATTEMPTS_EXCEEDED' | 'TIME_LIMIT_EXCEEDED',
    message: string
  ) {
    super(message);
    this.name = 'QuizError';
  }
}
