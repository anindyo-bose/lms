/**
 * Checkout Widget Types
 */

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  thumbnailUrl?: string;
  instructor: {
    id: string;
    name: string;
  };
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
}

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'requires_action'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export interface CheckoutState {
  course: Course | null;
  paymentIntent: PaymentIntent | null;
  loading: boolean;
  error: string | null;
  step: CheckoutStep;
}

export type CheckoutStep = 'loading' | 'summary' | 'payment' | 'processing' | 'success' | 'error';

export interface CheckoutConfig {
  stripePublishableKey: string;
  paymentServiceUrl: string;
  apiServiceUrl: string;
}

export interface CreatePaymentResponse {
  paymentIntent: {
    id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
  };
  clientSecret: string;
}

export interface ProcessPaymentResponse {
  success: boolean;
  paymentIntent: {
    id: string;
    status: PaymentStatus;
  };
  error?: string;
}

export interface CheckoutWidgetProps {
  courseId: string;
  onSuccess?: (paymentIntentId: string) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
  config?: Partial<CheckoutConfig>;
}

export interface OrderSummaryProps {
  course: Course;
  onProceed: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onBack: () => void;
}

export interface PaymentSuccessProps {
  course: Course;
  paymentIntentId: string;
  onContinue: () => void;
}
