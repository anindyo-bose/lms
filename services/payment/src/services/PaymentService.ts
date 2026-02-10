/**
 * Payment Service - Core payment processing logic
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { IPaymentProvider } from '../providers/IPaymentProvider';
import { StripeProvider } from '../providers/StripeProvider';
import { MockProvider } from '../providers/MockProvider';
import type {
  PaymentIntent,
  PaymentProvider,
  CreatePaymentRequest,
  ProcessPaymentRequest,
  PaymentResult,
  RefundRequest,
  RefundResult,
} from '../types';

export class PaymentService {
  private pool: Pool;
  private providers: Map<string, IPaymentProvider> = new Map();
  private defaultProvider: PaymentProvider;

  constructor(pool: Pool) {
    this.pool = pool;
    this.defaultProvider = (process.env.DEFAULT_PAYMENT_PROVIDER as PaymentProvider) || 'mock';
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize Stripe if configured
    if (process.env.STRIPE_SECRET_KEY) {
      this.providers.set(
        'stripe',
        new StripeProvider(
          process.env.STRIPE_SECRET_KEY,
          process.env.STRIPE_WEBHOOK_SECRET || ''
        )
      );
    }

    // Always have mock provider for development/testing
    this.providers.set('mock', new MockProvider());
  }

  /**
   * Get payment provider instance
   */
  private getProvider(name: PaymentProvider): IPaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Payment provider '${name}' not configured`);
    }
    return provider;
  }

  /**
   * Create a new payment intent
   */
  async createPayment(request: CreatePaymentRequest): Promise<PaymentResult> {
    const {
      userId,
      courseId,
      amount,
      currency = 'USD',
      provider = this.defaultProvider,
      metadata = {},
    } = request;

    // Validate amount
    if (amount < 50) {
      return {
        success: false,
        paymentIntent: {} as PaymentIntent,
        error: 'Minimum payment amount is $0.50',
      };
    }

    // Check if user already owns the course
    const existingEntitlement = await this.pool.query(
      `SELECT id FROM entitlements 
       WHERE student_id = $1 AND course_id = $2 AND expires_at IS NULL`,
      [userId, courseId]
    );

    if (existingEntitlement.rows.length > 0) {
      return {
        success: false,
        paymentIntent: {} as PaymentIntent,
        error: 'You already own this course',
      };
    }

    // Get course details
    const courseResult = await this.pool.query(
      `SELECT id, title, price FROM courses WHERE id = $1 AND deleted_at IS NULL`,
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return {
        success: false,
        paymentIntent: {} as PaymentIntent,
        error: 'Course not found',
      };
    }

    const course = courseResult.rows[0];

    // Create payment intent with provider
    const paymentProvider = this.getProvider(provider);
    const providerResult = await paymentProvider.createPaymentIntent(
      amount,
      currency,
      {
        userId,
        courseId,
        courseTitle: course.title,
        ...metadata,
      }
    );

    // Store in database
    const paymentId = uuidv4();
    const insertResult = await this.pool.query(
      `INSERT INTO transactions 
       (id, student_id, course_id, amount, currency, payment_provider, provider_transaction_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [
        paymentId,
        userId,
        courseId,
        amount,
        currency,
        provider,
        providerResult.providerPaymentId,
      ]
    );

    const paymentIntent: PaymentIntent = {
      id: insertResult.rows[0].id,
      userId,
      courseId,
      amount,
      currency,
      status: 'pending',
      provider,
      providerPaymentId: providerResult.providerPaymentId,
      metadata,
      createdAt: insertResult.rows[0].created_at,
      updatedAt: insertResult.rows[0].created_at,
    };

    return {
      success: true,
      paymentIntent,
      clientSecret: providerResult.clientSecret,
    };
  }

  /**
   * Process/confirm a payment
   */
  async processPayment(request: ProcessPaymentRequest): Promise<PaymentResult> {
    const { paymentIntentId, paymentMethodId, token } = request;

    // Get payment from database
    const paymentResult = await this.pool.query(
      `SELECT * FROM transactions WHERE id = $1`,
      [paymentIntentId]
    );

    if (paymentResult.rows.length === 0) {
      return {
        success: false,
        paymentIntent: {} as PaymentIntent,
        error: 'Payment not found',
      };
    }

    const payment = paymentResult.rows[0];
    const provider = this.getProvider(payment.payment_provider);

    // Process with provider
    const result = await provider.processPayment(
      payment.provider_transaction_id,
      paymentMethodId || token
    );

    // Update database
    await this.pool.query(
      `UPDATE transactions SET status = $1, completed_at = $2 WHERE id = $3`,
      [
        result.status,
        result.status === 'succeeded' ? new Date() : null,
        paymentIntentId,
      ]
    );

    // If successful, create entitlement
    if (result.status === 'succeeded') {
      await this.grantEntitlement(payment.student_id, payment.course_id, paymentIntentId);
    }

    const paymentIntent: PaymentIntent = {
      id: payment.id,
      userId: payment.student_id,
      courseId: payment.course_id,
      amount: payment.amount,
      currency: payment.currency,
      status: result.status,
      provider: payment.payment_provider,
      providerPaymentId: payment.provider_transaction_id,
      createdAt: payment.created_at,
      updatedAt: new Date(),
      completedAt: result.status === 'succeeded' ? new Date() : undefined,
    };

    return {
      success: result.status === 'succeeded',
      paymentIntent,
      error: result.error,
    };
  }

  /**
   * Refund a payment
   */
  async refundPayment(request: RefundRequest): Promise<RefundResult> {
    const { paymentIntentId, amount, reason } = request;

    // Get payment
    const paymentResult = await this.pool.query(
      `SELECT * FROM transactions WHERE id = $1 AND status = 'completed'`,
      [paymentIntentId]
    );

    if (paymentResult.rows.length === 0) {
      return {
        success: false,
        amount: 0,
        error: 'Payment not found or not completed',
      };
    }

    const payment = paymentResult.rows[0];
    const provider = this.getProvider(payment.payment_provider);

    // Process refund
    const result = await provider.refundPayment(
      payment.provider_transaction_id,
      amount || payment.amount
    );

    if (result.success) {
      // Update transaction status
      await this.pool.query(
        `UPDATE transactions SET status = 'refunded' WHERE id = $1`,
        [paymentIntentId]
      );

      // Revoke entitlement
      await this.pool.query(
        `DELETE FROM entitlements 
         WHERE student_id = $1 AND course_id = $2`,
        [payment.student_id, payment.course_id]
      );
    }

    return result;
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<PaymentIntent | null> {
    const result = await this.pool.query(
      `SELECT * FROM transactions WHERE id = $1`,
      [paymentId]
    );

    if (result.rows.length === 0) return null;

    const payment = result.rows[0];
    return {
      id: payment.id,
      userId: payment.student_id,
      courseId: payment.course_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.payment_provider,
      providerPaymentId: payment.provider_transaction_id,
      createdAt: payment.created_at,
      updatedAt: payment.created_at,
      completedAt: payment.completed_at,
    };
  }

  /**
   * Get user's payment history
   */
  async getUserPayments(userId: string): Promise<PaymentIntent[]> {
    const result = await this.pool.query(
      `SELECT t.*, c.title as course_title 
       FROM transactions t
       JOIN courses c ON t.course_id = c.id
       WHERE t.student_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );

    return result.rows.map((payment) => ({
      id: payment.id,
      userId: payment.student_id,
      courseId: payment.course_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.payment_provider,
      providerPaymentId: payment.provider_transaction_id,
      metadata: { courseTitle: payment.course_title },
      createdAt: payment.created_at,
      updatedAt: payment.created_at,
      completedAt: payment.completed_at,
    }));
  }

  /**
   * Handle webhook event
   */
  async handleWebhook(
    provider: PaymentProvider,
    payload: string,
    signature: string
  ): Promise<boolean> {
    const paymentProvider = this.getProvider(provider);

    // Verify signature
    if (!paymentProvider.verifyWebhook(payload, signature)) {
      console.error('Webhook signature verification failed');
      return false;
    }

    // Parse event
    const event = paymentProvider.parseWebhookEvent(payload);
    if (!event) {
      console.error('Failed to parse webhook event');
      return false;
    }

    // Find payment by provider ID
    const paymentResult = await this.pool.query(
      `SELECT * FROM transactions WHERE provider_transaction_id = $1`,
      [event.providerPaymentId]
    );

    if (paymentResult.rows.length === 0) {
      console.error('Payment not found for webhook:', event.providerPaymentId);
      return false;
    }

    const payment = paymentResult.rows[0];

    // Update status
    await this.pool.query(
      `UPDATE transactions SET status = $1, completed_at = $2 WHERE id = $3`,
      [
        event.status,
        event.status === 'succeeded' ? new Date() : null,
        payment.id,
      ]
    );

    // Grant entitlement if succeeded
    if (event.status === 'succeeded') {
      await this.grantEntitlement(payment.student_id, payment.course_id, payment.id);
    }

    return true;
  }

  /**
   * Grant course entitlement after successful payment
   */
  private async grantEntitlement(
    userId: string,
    courseId: string,
    transactionId: string
  ): Promise<void> {
    // Create entitlement
    await this.pool.query(
      `INSERT INTO entitlements (student_id, course_id, transaction_id, granted_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (student_id, course_id) DO NOTHING`,
      [userId, courseId, transactionId]
    );

    // Also create enrollment
    await this.pool.query(
      `INSERT INTO enrollments (student_id, course_id, enrolled_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (student_id, course_id) DO NOTHING`,
      [userId, courseId]
    );
  }
}
