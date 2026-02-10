# Widget Contracts & Event Specifications

All widget communication happens via **explicit contracts**. No direct state sharing. No implicit side effects.

---

## Contract Definitions

### 1. IAuthWidget Contract

**Location**: [packages/shared-types/src/contracts/IAuthWidget.ts](../../../packages/shared-types/src/contracts/IAuthWidget.ts)

**Version**: 1.1.0 (IAuthWidget@1.1)

**Responsibility**: Authentication state management, login/signup, token refresh

```typescript
/**
 * Auth Widget Contract
 * All authentication operations and state synchronization
 */
export interface IAuthWidget {
  /**
   * Get currently authenticated user
   * @returns User object if logged in, null otherwise
   * @throws Never throws; returns null on error
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * Authenticate user with email & password
   * @param email User email
   * @param password User password (UTF-8, no length limit enforced client-side)
   * @returns JWT token + authenticated user object
   * @throws AuthError if credentials invalid or account locked
   */
  login(email: string, password: string): Promise<{
    token: string;
    refreshToken: string;
    user: User;
    expiresIn: number; // seconds
  }>;

  /**
   * Register new user
   * @param data Signup payload (email, password, name, role)
   * @returns JWT token + newly created user
   * @throws SignupError if email exists or validation fails
   */
  signup(data: SignupPayload): Promise<{
    token: string;
    refreshToken: string;
    user: User;
    expiresIn: number;
  }>;

  /**
   * Force password change (e.g., after account reset)
   * @param oldPassword Current password
   * @param newPassword New password
   * @throws PasswordError if old password incorrect
   */
  changePassword(oldPassword: string, newPassword: string): Promise<void>;

  /**
   * Refresh access token using refresh token
   * @returns New access token
   * @throws TokenError if refresh token expired
   */
  refreshToken(): Promise<string>;

  /**
   * Logout & clear local auth state
   * @throws Never
   */
  logout(): Promise<void>;

  /**
   * Subscribe to auth state changes
   * Fires when user logs in, logs out, or token refreshes
   * @param callback Function called with (user | null)
   * @returns Unsubscribe function
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}

export interface SignupPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'educator';
  agreedToTerms: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'educator' | 'admin' | 'super_admin';
  createdAt: string; // ISO 8601
  lastLoginAt: string | null;
  mustChangePassword: boolean;
}

export class AuthError extends Error {
  constructor(
    public code: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'EMAIL_NOT_VERIFIED',
    message: string
  ) {
    super(message);
  }
}
```

**Usage Example**:

```typescript
// apps/shell/src/hooks/useAuth.ts
import { IAuthWidget } from '@composey/shared-types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const authWidget = useRef<IAuthWidget | null>(null);

  useEffect(() => {
    loadMFE('auth-widget').then(mfe => {
      authWidget.current = mfe.contracts;
      
      // Load current user
      mfe.contracts.getCurrentUser().then(setUser);

      // Listen for changes
      return mfe.contracts.onAuthStateChange(setUser);
    });
  }, []);

  return { user, authWidget: authWidget.current };
}
```

---

### 2. ICourseWidget Contract

**Version**: 1.0.0 (ICourseWidget@1.0)

**Responsibility**: Course creation, updates, retrieval (educator + admin functions)

```typescript
export interface ICourseWidget {
  /**
   * List all courses visible to current user
   * - Educator: Own courses
   * - Student: Enrolled courses
   * - Admin: All courses
   */
  getCourses(filters?: CourseFilters): Promise<Course[]>;

  /**
   * Get single course details
   * Enforced server-side: user must be educator (owner) or student (enrolled)
   */
  getCourse(courseId: string): Promise<Course | null>;

  /**
   * Create new course (educator role required, enforced server-side)
   * @param data Course creation payload
   * @returns Created course object
   */
  createCourse(data: CreateCoursePayload): Promise<Course>;

  /**
   * Update course (educator + ownership required, enforced server-side)
   * @param courseId Course identifier
   * @param data Partial course updates
   * @returns Updated course object
   */
  updateCourse(courseId: string, data: UpdateCoursePayload): Promise<Course>;

  /**
   * Delete course (educator + ownership required, enforced server-side)
   * @param courseId Course identifier
   */
  deleteCourse(courseId: string): Promise<void>;

  /**
   * Enroll student in course (student role, enforced server-side)
   * May require payment (checkout-widget integration)
   */
  enrollStudent(courseId: string, paymentEnrollmentId?: string): Promise<Enrollment>;

  /**
   * Subscribe to course updates (e.g., when lesson added by educator)
   */
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
  price: number; // in cents (e.g., 9999 = $99.99)
  isFree: boolean;
  imageUrl: string;
  primaryColor: string;
  lessonCount: number;
  enrollmentCount: number;
  rating: number; // 0-5
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  isPublished: boolean;
  curriculum?: Lesson[]; // Optional, full details
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
  price: number; // in cents
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
```

---

### 3. ILessonWidget Contract

**Version**: 1.0.0 (ILessonWidget@1.0)

**Responsibility**: Lesson content serving, progress tracking

```typescript
export interface ILessonWidget {
  /**
   * Get lesson details
   * Server enforces: student must be enrolled in course
   */
  getLesson(lessonId: string): Promise<Lesson | null>;

  /**
   * Get all lessons in course (paginated)
   * Server enforces: student enrolled or educator is owner
   */
  getLessons(courseId: string, pagination?: Pagination): Promise<PaginatedLessons>;

  /**
   * Create lesson (educator + course ownership, enforced server-side)
   */
  createLesson(courseId: string, data: CreateLessonPayload): Promise<Lesson>;

  /**
   * Update lesson (educator + ownership, enforced server-side)
   */
  updateLesson(lessonId: string, data: UpdateLessonPayload): Promise<Lesson>;

  /**
   * Delete lesson (educator + ownership, enforced server-side)
   */
  deleteLesson(lessonId: string): Promise<void>;

  /**
   * Submit student progress (completion, time spent)
   * Server enforces: student owns progress record
   */
  updateProgress(lessonId: string, progress: LessonProgress): Promise<void>;

  /**
   * Stream secure lesson video URL (with expiry)
   * Returns cloud storage URL good for 1 hour
   */
  getVideoStreamUrl(lessonId: string, videoId: string): Promise<string>;

  /**
   * Subscribe to lesson updates (e.g., educator published new version)
   */
  onLessonUpdate(callback: (lesson: Lesson) => void): () => void;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: string; // HTML or Markdown
  videoUrls?: {
    hd: string;
    sd: string;
    mobile: string;
  };
  attachments?: LessonAttachment[];
  duration: number; // seconds
  order: number; // position in course
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonProgress {
  completionPercentage: number; // 0-100
  timeSpentSeconds: number;
  bookmarkAt?: number; // seconds, if video
  completedAt?: string; // ISO 8601, if fully complete
}

export interface CreateLessonPayload {
  title: string;
  description: string;
  content: string;
  duration: number;
  order: number;
  videoUploadId?: string; // From upload service
}

export interface UpdateLessonPayload {
  title?: string;
  description?: string;
  content?: string;
  duration?: number;
  order?: number;
  isPublished?: boolean;
}
```

---

### 4. IQuizWidget Contract

**Version**: 1.0.0 (IQuizWidget@1.0)

**Responsibility**: Quiz building, student attempts, scoring (cheating-proof)

```typescript
export interface IQuizWidget {
  /**
   * Get quiz details
   * Educator: sees all versions, answers
   * Student: sees only active quiz, no answers
   */
  getQuiz(quizId: string): Promise<Quiz | null>;

  /**
   * List quizzes in lesson (educator) or attempt quiz (student)
   */
  getQuizzesForLesson(lessonId: string): Promise<Quiz[]>;

  /**
   * Create quiz (educator + course ownership)
   */
  createQuiz(lessonId: string, data: CreateQuizPayload): Promise<Quiz>;

  /**
   * Update quiz (educator + ownership)
   * Cannot modify after first student attempt
   */
  updateQuiz(quizId: string, data: UpdateQuizPayload): Promise<Quiz>;

  /**
   * Submit quiz attempt
   * Server validates: student hasn't exceeded max attempts
   * Server validates: answers within time window
   * Server prevents answer injection
   */
  submitQuizAttempt(quizId: string, answers: QuizAnswer[]): Promise<QuizSubmission>;

  /**
   * Get student's previous attempts
   */
  getAttemptHistory(quizId: string): Promise<QuizSubmission[]>;

  /**
   * Educator views student's attempt & answers
   */
  getAttempt(attemptId: string): Promise<QuizSubmission | null>;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  timeLimit: number; // seconds
  maxAttempts: number;
  passingScore: number; // 0-100
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
  options?: string[]; // For multiple choice
  correctAnswer?: string | string[]; // Server-side only
  points: number;
  explanation?: string;
}

export interface QuizAnswer {
  questionId: string;
  studentAnswer: string | string[];
  timeToAnswer: number; // seconds
}

export interface QuizSubmission {
  id: string;
  studentId: string;
  quizId: string;
  answers: QuizAnswer[];
  score: number; // 0-100 (calculated server-side)
  passed: boolean;
  submittedAt: string;
  completedIn: number; // seconds
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

export interface UpdateQuizPayload {
  title?: string;
  description?: string;
  timeLimit?: number;
  maxAttempts?: number;
  passingScore?: number;
  isPublished?: boolean;
}
```

---

### 5. IProgressWidget Contract

**Version**: 1.0.0 (IProgressWidget@1.0)

**Responsibility**: Read-only progress aggregation (computed server-side)

```typescript
export interface IProgressWidget {
  /**
   * Get student's overall progress in course
   * Server computes from lesson_progress, quiz_submissions
   */
  getCourseProgress(courseId: string): Promise<CourseProgress>;

  /**
   * Get student's overall progress across all courses
   */
  getAllProgressSummary(): Promise<CourseSummary[]>;

  /**
   * Get detailed progress per lesson
   */
  getLessonProgress(courseId: string, lessonId: string): Promise<LessonProgressDetail>;

  /**
   * Get quiz attempt history with scores
   */
  getQuizHistory(lessonId: string): Promise<QuizHistoryItem[]>;

  /**
   * Get certificates earned
   */
  getCertificates(): Promise<Certificate[]>;

  /**
   * Subscribe to progress updates (e.g., lesson completed)
   */
  onProgressUpdate(callback: (progress: CourseProgress) => void): () => void;
}

export interface CourseProgress {
  courseId: string;
  courseName: string;
  completionPercentage: number; // 0-100
  lessonsCompleted: number;
  lessonsTotal: number;
  averageQuizScore: number; // 0-100, or null if no quizzes
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
  bookmarkAt?: number; // video second position if video lesson
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
  validUntil?: string; // If certificate expires
  url: string; // Download URL
}
```

---

### 6. ICheckoutWidget Contract

**Version**: 1.0.0 (ICheckoutWidget@1.0)

**Responsibility**: Course enrollment, payment processing, entitlement confirmation

```typescript
export interface ICheckoutWidget {
  /**
   * Get course details for checkout
   * Includes payment methods, pricing
   */
  getCourseForCheckout(courseId: string): Promise<CheckoutCourse>;

  /**
   * Initiate payment flow
   * Returns Stripe/PayPal session ID for external form
   */
  initiatePayment(courseId: string, paymentMethod: 'card' | 'paypal'): Promise<{
    sessionId: string;
    clientSecret: string;
    publicKey: string;
  }>;

  /**
   * Verify payment & grant entitlement
   * Called after payment gateway returns success
   * Server verifies webhook before granting access
   */
  confirmEnrollment(enrollmentId: string): Promise<Enrollment>;

  /**
   * Get user's invoice history
   */
  getInvoices(courseId?: string): Promise<Invoice[]>;

  /**
   * Request refund (within 30 days)
   */
  requestRefund(enrollmentId: string, reason: string): Promise<RefundRequest>;

  /**
   * Check student is enrolled in course (permission check)
   */
  isEnrolled(courseId: string): Promise<boolean>;

  /**
   * Subscribe to enrollment status changes
   */
  onEnrollmentStatusChange(callback: (enrollment: Enrollment) => void): () => void;
}

export interface CheckoutCourse {
  id: string;
  title: string;
  price: number; // cents
  isFree: boolean;
  description: string;
  educatorName: string;
  paymentMethods: PaymentMethod[];
}

export interface PaymentMethod {
  id: string;
  provider: 'stripe' | 'paypal';
  displayName: string;
  logo: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  amountPaid: number; // cents
  paidAt?: string;
  enrolledAt: string;
  expiresAt?: string; // For subscription-based courses
  refundStatus?: 'none' | 'requested' | 'approved' | 'completed';
}

export interface Invoice {
  id: string;
  enrollmentId: string;
  courseId: string;
  date: string;
  amount: number; // cents
  status: 'issued' | 'paid';
  transactionId: string;
  downloadUrl: string;
}

export interface RefundRequest {
  id: string;
  enrollmentId: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reason: string;
  requestedAt: string;
  processedAt?: string;
  refundAmount: number; // cents
}
```

---

## Event Specifications

### AuthEvents

```typescript
// events/AuthEvents.ts
export const AuthEvents = {
  USER_LOGGED_IN: 'auth:user_logged_in',
  USER_LOGGED_OUT: 'auth:user_logged_out',
  USER_SESSION_EXPIRED: 'auth:session_expired',
  PASSWORD_CHANGED: 'auth:password_changed',
  SUPER_ADMIN_CREATED: 'auth:super_admin_created',
} as const;

export interface UserLoggedInEvent {
  type: typeof AuthEvents.USER_LOGGED_IN;
  userId: string;
  email: string;
  role: string;
  timestamp: string;
}

export interface UserLoggedOutEvent {
  type: typeof AuthEvents.USER_LOGGED_OUT;
  userId: string;
  timestamp: string;
}
```

### CourseEvents

```typescript
export const CourseEvents = {
  COURSE_CREATED: 'course:created',
  COURSE_UPDATED: 'course:updated',
  COURSE_PUBLISHED: 'course:published',
  LESSON_ADDED: 'course:lesson_added',
  STUDENT_ENROLLED: 'course:student_enrolled',
} as const;

export interface CourseCreatedEvent {
  type: typeof CourseEvents.COURSE_CREATED;
  courseId: string;
  educatorId: string;
  title: string;
  timestamp: string;
}
```

### PaymentEvents

```typescript
export const PaymentEvents = {
  PAYMENT_COMPLETED: 'payment:completed',
  PAYMENT_FAILED: 'payment:failed',
  REFUND_COMPLETED: 'payment:refund_completed',
  INVOICE_ISSUED: 'payment:invoice_issued',
} as const;

export interface PaymentCompletedEvent {
  type: typeof PaymentEvents.PAYMENT_COMPLETED;
  enrollmentId: string;
  courseId: string;
  studentId: string;
  amount: number;
  transactionId: string;
  timestamp: string;
}
```

---

## Contract Validation at Runtime

**File**: [packages/contract-specs/src/validators/](../../../packages/contract-specs/src/validators/)

Each contract has a validator that ensures loaded MFE matches spec:

```typescript
// contract-specs/src/validators/AuthValidator.ts
import { IAuthWidget } from '@composey/shared-types';

export class AuthValidator {
  static validate(widget: any, contractVersion: string): boolean {
    // Check contract version matches
    if (!contractVersion.startsWith('IAuthWidget@1')) {
      throw new Error(`Unsupported contract version: ${contractVersion}`);
    }

    // Check all required methods exist
    const required = [
      'getCurrentUser',
      'login',
      'signup',
      'logout',
      'onAuthStateChange',
      'refreshToken',
      'changePassword',
    ];

    for (const method of required) {
      if (typeof widget[method] !== 'function') {
        throw new Error(`Auth widget missing method: ${method}`);
      }
    }

    return true;
  }
}
```

Used in shell:

```typescript
import { AuthValidator } from '@composey/contract-specs';

const mfe = await loadMFE('auth-widget', 'IAuthWidget@1.1');
AuthValidator.validate(mfe.contracts, 'IAuthWidget@1.1'); // Throws if invalid
```

---

## Summary

Each widget contract is:

✅ **Explicit**: All methods, return types, parameters defined  
✅ **Versioned**: Semantic versioning (MAJOR.MINOR.PATCH)  
✅ **Server-enforced**: Permissions checked server-side, not trusted to widget  
✅ **Testable**: Contract tests validate both MFE and shell compliance  
✅ **Documented**: JSDoc comments, examples, error cases  
✅ **Replaceable**: Old versions can run in parallel with new versions  

No widget bypasses contracts. No shortcuts. Security first.
