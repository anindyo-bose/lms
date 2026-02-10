/**
 * useCheckout Hook - Manages checkout flow state
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import type {
  Course,
  PaymentIntent,
  CheckoutState,
  CheckoutStep,
  CheckoutConfig,
  CreatePaymentResponse,
} from '../types';

const defaultConfig: CheckoutConfig = {
  stripePublishableKey: import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY || '',
  paymentServiceUrl: import.meta.env?.VITE_PAYMENT_SERVICE_URL || 'http://localhost:3009',
  apiServiceUrl: import.meta.env?.VITE_API_SERVICE_URL || 'http://localhost:3007',
};

// Support both Vite and non-Vite environments
declare global {
  interface ImportMeta {
    env?: Record<string, string>;
  }
}

interface UseCheckoutOptions {
  config?: Partial<CheckoutConfig>;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

interface UseCheckoutReturn {
  state: CheckoutState;
  loadCourse: (courseId: string) => Promise<void>;
  createPaymentIntent: (courseId: string, amount: number) => Promise<void>;
  completePayment: (paymentIntentId: string) => void;
  setStep: (step: CheckoutStep) => void;
  reset: () => void;
  config: CheckoutConfig;
}

export function useCheckout(options: UseCheckoutOptions = {}): UseCheckoutReturn {
  const config = { ...defaultConfig, ...options.config };

  const [state, setState] = useState<CheckoutState>({
    course: null,
    paymentIntent: null,
    loading: false,
    error: null,
    step: 'loading',
  });

  const loadCourse = useCallback(async (courseId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await axios.get<Course>(
        `${config.apiServiceUrl}/api/courses/${courseId}`,
        { withCredentials: true }
      );

      setState((prev) => ({
        ...prev,
        course: response.data,
        loading: false,
        step: 'summary',
      }));
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || 'Failed to load course'
        : 'Failed to load course';

      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
        step: 'error',
      }));

      options.onError?.(message);
    }
  }, [config.apiServiceUrl, options]);

  const createPaymentIntent = useCallback(async (courseId: string, amount: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await axios.post<CreatePaymentResponse>(
        `${config.paymentServiceUrl}/api/payments`,
        {
          courseId,
          amount,
          currency: 'USD',
        },
        { withCredentials: true }
      );

      const paymentIntent: PaymentIntent = {
        id: response.data.paymentIntent.id,
        clientSecret: response.data.clientSecret,
        amount: response.data.paymentIntent.amount,
        currency: response.data.paymentIntent.currency,
        status: response.data.paymentIntent.status,
      };

      setState((prev) => ({
        ...prev,
        paymentIntent,
        loading: false,
        step: 'payment',
      }));
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || 'Failed to create payment'
        : 'Failed to create payment';

      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
        step: 'error',
      }));

      options.onError?.(message);
    }
  }, [config.paymentServiceUrl, options]);

  const completePayment = useCallback((paymentIntentId: string) => {
    setState((prev) => ({
      ...prev,
      step: 'success',
    }));
    options.onSuccess?.(paymentIntentId);
  }, [options]);

  const setStep = useCallback((step: CheckoutStep) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const reset = useCallback(() => {
    setState({
      course: null,
      paymentIntent: null,
      loading: false,
      error: null,
      step: 'loading',
    });
  }, []);

  return {
    state,
    loadCourse,
    createPaymentIntent,
    completePayment,
    setStep,
    reset,
    config,
  };
}

export default useCheckout;
