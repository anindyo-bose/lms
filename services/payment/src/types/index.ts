/**
 * Payment Types
 */

export interface PaymentIntent {
  id: string;
  userId: string;
  courseId: string;
  amount: number; // cents
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  providerPaymentId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'requires_action'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded';

export type PaymentProvider = 'stripe' | 'paypal' | 'mock';

export interface CreatePaymentRequest {
  userId: string;
  courseId: string;
  amount: number;
  currency?: string;
  provider?: PaymentProvider;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentRequest {
  paymentIntentId: string;
  paymentMethodId?: string;
  token?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntent: PaymentIntent;
  clientSecret?: string;
  redirectUrl?: string;
  error?: string;
}

export interface RefundRequest {
  paymentIntentId: string;
  amount?: number; // partial refund amount in cents
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount: number;
  error?: string;
}

export interface PaymentProviderConfig {
  stripe?: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
  };
  paypal?: {
    clientId: string;
    clientSecret: string;
    mode: 'sandbox' | 'live';
  };
}

export const PAYMENT_ERRORS = {
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
  ALREADY_PURCHASED: 'ALREADY_PURCHASED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  REFUND_FAILED: 'REFUND_FAILED',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
} as const;
