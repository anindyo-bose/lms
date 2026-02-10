/**
 * Payment Provider Interface
 * Abstract interface for different payment providers
 */

import type { PaymentIntent, PaymentResult, RefundResult } from '../types';

export interface IPaymentProvider {
  name: string;
  
  /**
   * Create a payment intent with the provider
   */
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, any>
  ): Promise<{ providerPaymentId: string; clientSecret?: string }>;

  /**
   * Process/confirm a payment
   */
  processPayment(
    providerPaymentId: string,
    paymentMethodId?: string
  ): Promise<{ status: PaymentIntent['status']; error?: string }>;

  /**
   * Refund a payment
   */
  refundPayment(
    providerPaymentId: string,
    amount?: number
  ): Promise<RefundResult>;

  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: string, signature: string): boolean;

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: string): {
    type: string;
    providerPaymentId: string;
    status: PaymentIntent['status'];
  } | null;
}
