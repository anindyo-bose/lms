/**
 * Mock Payment Provider
 * For development and testing without real payment processing
 */

import { v4 as uuidv4 } from 'uuid';
import type { IPaymentProvider } from './IPaymentProvider';
import type { PaymentIntent, RefundResult } from '../types';

export class MockProvider implements IPaymentProvider {
  name = 'mock';
  
  // Simulated delay for realistic testing
  private delay = 500;

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, any>
  ): Promise<{ providerPaymentId: string; clientSecret?: string }> {
    await this.simulateDelay();
    
    const providerPaymentId = `mock_pi_${uuidv4()}`;
    const clientSecret = `mock_secret_${uuidv4()}`;

    return {
      providerPaymentId,
      clientSecret,
    };
  }

  async processPayment(
    providerPaymentId: string,
    paymentMethodId?: string
  ): Promise<{ status: PaymentIntent['status']; error?: string }> {
    await this.simulateDelay();

    // Simulate different outcomes based on payment method
    if (paymentMethodId === 'pm_card_declined') {
      return {
        status: 'failed',
        error: 'Your card was declined.',
      };
    }

    if (paymentMethodId === 'pm_card_requires_action') {
      return {
        status: 'requires_action',
      };
    }

    // Default: success
    return {
      status: 'succeeded',
    };
  }

  async refundPayment(
    providerPaymentId: string,
    amount?: number
  ): Promise<RefundResult> {
    await this.simulateDelay();

    return {
      success: true,
      refundId: `mock_re_${uuidv4()}`,
      amount: amount || 0,
    };
  }

  verifyWebhook(payload: string, signature: string): boolean {
    // Mock always verifies
    return signature === 'mock_signature';
  }

  parseWebhookEvent(payload: string): {
    type: string;
    providerPaymentId: string;
    status: PaymentIntent['status'];
  } | null {
    try {
      const event = JSON.parse(payload);
      return {
        type: event.type,
        providerPaymentId: event.payment_intent_id,
        status: event.status,
      };
    } catch {
      return null;
    }
  }

  private simulateDelay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.delay));
  }
}
