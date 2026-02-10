/**
 * Payment Routes
 */

import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import type { PaymentProvider } from '../types';

export function createPaymentRoutes(paymentService: PaymentService): Router {
  const router = Router();

  /**
   * Create payment intent for course purchase
   * POST /api/payments
   */
  router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { courseId, amount, currency, provider } = req.body;

      if (!courseId || !amount) {
        return res.status(400).json({ error: 'courseId and amount are required' });
      }

      const result = await paymentService.createPayment({
        userId: req.user!.id,
        courseId,
        amount,
        currency,
        provider,
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(201).json({
        paymentIntent: result.paymentIntent,
        clientSecret: result.clientSecret,
      });
    } catch (error) {
      console.error('Create payment error:', error);
      return res.status(500).json({ error: 'Failed to create payment' });
    }
  });

  /**
   * Process/confirm payment
   * POST /api/payments/:id/process
   */
  router.post('/:id/process', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { paymentMethodId, token } = req.body;

      const result = await paymentService.processPayment({
        paymentIntentId: req.params.id,
        paymentMethodId,
        token,
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json({
        success: true,
        paymentIntent: result.paymentIntent,
      });
    } catch (error) {
      console.error('Process payment error:', error);
      return res.status(500).json({ error: 'Failed to process payment' });
    }
  });

  /**
   * Get payment by ID
   * GET /api/payments/:id
   */
  router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const payment = await paymentService.getPayment(req.params.id);

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Users can only view their own payments (admins can view all)
      if (
        payment.userId !== req.user!.id &&
        req.user!.role !== 'super_admin' &&
        req.user!.role !== 'instructor'
      ) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json(payment);
    } catch (error) {
      console.error('Get payment error:', error);
      return res.status(500).json({ error: 'Failed to get payment' });
    }
  });

  /**
   * Get user's payment history
   * GET /api/payments/user/history
   */
  router.get('/user/history', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const payments = await paymentService.getUserPayments(req.user!.id);
      return res.json(payments);
    } catch (error) {
      console.error('Get payment history error:', error);
      return res.status(500).json({ error: 'Failed to get payment history' });
    }
  });

  /**
   * Refund payment (admin only)
   * POST /api/payments/:id/refund
   */
  router.post(
    '/:id/refund',
    requireAuth,
    requireAdmin,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { amount, reason } = req.body;

        const result = await paymentService.refundPayment({
          paymentIntentId: req.params.id,
          amount,
          reason,
        });

        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }

        return res.json({
          success: true,
          refundedAmount: result.amount,
          refundId: result.refundId,
        });
      } catch (error) {
        console.error('Refund payment error:', error);
        return res.status(500).json({ error: 'Failed to refund payment' });
      }
    }
  );

  /**
   * Stripe webhook handler
   * POST /api/payments/webhooks/stripe
   */
  router.post(
    '/webhooks/stripe',
    async (req: Request, res: Response) => {
      try {
        const signature = req.headers['stripe-signature'] as string;
        const payload = req.body;

        if (!signature) {
          return res.status(400).json({ error: 'Missing signature' });
        }

        const success = await paymentService.handleWebhook(
          'stripe' as PaymentProvider,
          typeof payload === 'string' ? payload : JSON.stringify(payload),
          signature
        );

        if (!success) {
          return res.status(400).json({ error: 'Webhook processing failed' });
        }

        return res.json({ received: true });
      } catch (error) {
        console.error('Stripe webhook error:', error);
        return res.status(500).json({ error: 'Webhook handler failed' });
      }
    }
  );

  return router;
}
