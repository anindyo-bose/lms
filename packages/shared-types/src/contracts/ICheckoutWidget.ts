/**
 * Checkout Widget Contract
 */

export interface ICheckoutWidget {
  getCourseForCheckout(courseId: string): Promise<CheckoutCourse>;
  initiatePayment(courseId: string, paymentMethod: 'card' | 'paypal'): Promise<PaymentSession>;
  confirmEnrollment(enrollmentId: string): Promise<Enrollment>;
  getInvoices(courseId?: string): Promise<Invoice[]>;
  requestRefund(enrollmentId: string, reason: string): Promise<RefundRequest>;
  isEnrolled(courseId: string): Promise<boolean>;
  onEnrollmentStatusChange(callback: (enrollment: Enrollment) => void): () => void;
}

export interface CheckoutCourse {
  id: string;
  title: string;
  price: number;
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

export interface PaymentSession {
  sessionId: string;
  clientSecret: string;
  publicKey: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  amountPaid: number;
  paidAt?: string;
  enrolledAt: string;
  expiresAt?: string;
  refundStatus?: 'none' | 'requested' | 'approved' | 'completed';
}

export interface Invoice {
  id: string;
  enrollmentId: string;
  courseId: string;
  date: string;
  amount: number;
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
  refundAmount: number;
}

export class CheckoutError extends Error {
  constructor(
    public code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'PAYMENT_FAILED' | 'ALREADY_ENROLLED',
    message: string
  ) {
    super(message);
    this.name = 'CheckoutError';
  }
}
