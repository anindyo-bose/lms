/**
 * Stripe Payment Provider
 */

import Stripe from 'stripe';
import type { IPaymentProvider } from './IPaymentProvider';
import type { PaymentIntent, RefundResult } from '../types';

export class StripeProvider implements IPaymentProvider {
  name = 'stripe';
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(secretKey: string, webhookSecret: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
    this.webhookSecret = webhookSecret;
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, any>
  ): Promise<{ providerPaymentId: string; clientSecret?: string }> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      providerPaymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || undefined,
    };
  }

  async processPayment(
    providerPaymentId: string,
    paymentMethodId?: string
  ): Promise<{ status: PaymentIntent['status']; error?: string }> {
    try {
      let paymentIntent: Stripe.PaymentIntent;

      if (paymentMethodId) {
        paymentIntent = await this.stripe.paymentIntents.confirm(providerPaymentId, {
          payment_method: paymentMethodId,
        });
      } else {
        paymentIntent = await this.stripe.paymentIntents.retrieve(providerPaymentId);
      }

      return {
        status: this.mapStripeStatus(paymentIntent.status),
      };
    } catch (error: any) {
      return {
        status: 'failed',
        error: error.message,
      };
    }
  }

  async refundPayment(
    providerPaymentId: string,
    amount?: number
  ): Promise<RefundResult> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: providerPaymentId,
        amount: amount,
      });

      return {
        success: refund.status === 'succeeded',
        refundId: refund.id,
        amount: refund.amount,
      };
    } catch (error: any) {
      return {
        success: false,
        amount: 0,
        error: error.message,
      };
    }
  }

  verifyWebhook(payload: string, signature: string): boolean {
    try {
      this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      return true;
    } catch {
      return false;
    }
  }

  parseWebhookEvent(payload: string): {
    type: string;
    providerPaymentId: string;
    status: PaymentIntent['status'];
  } | null {
    try {
      const event = JSON.parse(payload) as Stripe.Event;
      
      if (event.type.startsWith('payment_intent.')) {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        return {
          type: event.type,
          providerPaymentId: paymentIntent.id,
          status: this.mapStripeStatus(paymentIntent.status),
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  private mapStripeStatus(stripeStatus: Stripe.PaymentIntent.Status): PaymentIntent['status'] {
    switch (stripeStatus) {
      case 'succeeded':
        return 'succeeded';
      case 'processing':
        return 'processing';
      case 'requires_action':
      case 'requires_confirmation':
      case 'requires_payment_method':
        return 'requires_action';
      case 'canceled':
        return 'canceled';
      default:
        return 'pending';
    }
  }
}
