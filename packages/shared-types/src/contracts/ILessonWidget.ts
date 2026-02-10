/**
 * Lesson Viewer Widget Contract
 */

export interface ILessonWidget {
  getLesson(lessonId: string): Promise<Lesson | null>;
  getLessons(courseId: string, pagination?: Pagination): Promise<PaginatedLessons>;
  createLesson(courseId: string, data: CreateLessonPayload): Promise<Lesson>;
  updateLesson(lessonId: string, data: UpdateLessonPayload): Promise<Lesson>;
  deleteLesson(lessonId: string): Promise<void>;
  updateProgress(lessonId: string, progress: LessonProgress): Promise<void>;
  getVideoStreamUrl(lessonId: string, videoId: string): Promise<string>;
  onLessonUpdate(callback: (lesson: Lesson) => void): () => void;
}

export interface Pagination {
  page: number;
  limit: number;
}

export interface PaginatedLessons {
  items: Lesson[];
  total: number;
  page: number;
  limit: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  videoUrls?: Record<string, string>;
  attachments?: LessonAttachment[];
  duration: number;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface LessonProgress {
  completionPercentage: number;
  timeSpentSeconds: number;
  bookmarkAt?: number;
  completedAt?: string;
}

export interface CreateLessonPayload {
  title: string;
  description: string;
  content: string;
  duration: number;
  order: number;
  videoUploadId?: string;
}

export interface UpdateLessonPayload {
  title?: string;
  description?: string;
  content?: string;
  duration?: number;
  order?: number;
  isPublished?: boolean;
}

export class LessonError extends Error {
  constructor(
    public code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION_ERROR',
    message: string
  ) {
    super(message);
    this.name = 'LessonError';
  }
}
