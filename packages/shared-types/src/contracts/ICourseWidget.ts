/**
 * Course Management Widget Contract
 */

export interface ICourseWidget {
  getCourses(filters?: CourseFilters): Promise<Course[]>;
  getCourse(courseId: string): Promise<Course | null>;
  createCourse(data: CreateCoursePayload): Promise<Course>;
  updateCourse(courseId: string, data: UpdateCoursePayload): Promise<Course>;
  deleteCourse(courseId: string): Promise<void>;
  enrollStudent(courseId: string, enrollmentId?: string): Promise<Enrollment>;
  onCourseUpdate(callback: (course: Course) => void): () => void;
}

export interface CourseFilters {
  search?: string;
  category?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  sort?: 'newest' | 'oldest' | 'popularity';
}

export interface Course {
  id: string;
  title: string;
  description: string;
  educatorId: string;
  educatorName: string;
  category: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  isFree: boolean;
  imageUrl: string;
  primaryColor: string;
  lessonCount: number;
  enrollmentCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  isPublished: boolean;
  curriculum?: Lesson[];
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  duration: number;
  isPublished: boolean;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  completionPercentage: number;
  lastAccessedAt: string | null;
}

export interface CreateCoursePayload {
  title: string;
  description: string;
  category: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  isFree: boolean;
  imageUrl?: string;
  primaryColor?: string;
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  category?: string;
  difficultyLevel?: string;
  price?: number;
  isFree?: boolean;
  imageUrl?: string;
  primaryColor?: string;
}

export class CourseError extends Error {
  constructor(
    public code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'ALREADY_ENROLLED',
    message: string
  ) {
    super(message);
    this.name = 'CourseError';
  }
}
