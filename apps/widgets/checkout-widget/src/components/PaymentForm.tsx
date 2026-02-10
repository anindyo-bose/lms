/**
 * Payment Form Component - Stripe Elements Integration
 */

import React, { useState } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { PaymentFormProps } from '../types';

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    maxWidth: '480px',
    margin: '0 auto',
  },
  header: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '24px',
    color: '#1a1a1a',
  },
  amountDisplay: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#1a1a1a',
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  paymentElementContainer: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  errorMessage: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  backButton: {
    flex: 1,
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 500,
    color: '#666',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  payButton: {
    flex: 2,
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#0066cc',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  disabledButton: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  secureNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#666',
    marginTop: '16px',
  },
  lockIcon: {
    width: '16px',
    height: '16px',
  },
};

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount / 100);
}

interface CheckoutFormInnerProps {
  amount: number;
  currency: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onBack: () => void;
}

function CheckoutFormInner({
  amount,
  currency,
  onSuccess,
  onError,
  onBack,
}: CheckoutFormInnerProps): JSX.Element {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        const errorMessage = result.error.message || 'Payment failed';
        setError(errorMessage);
        onError(errorMessage);
      } else if (result.paymentIntent) {
        if (result.paymentIntent.status === 'succeeded') {
          onSuccess(result.paymentIntent.id);
        } else if (result.paymentIntent.status === 'requires_action') {
          setError('Additional verification required');
        } else {
          setError(`Payment status: ${result.paymentIntent.status}`);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Payment Details</h2>
      <div style={styles.amountDisplay}>{formatPrice(amount, currency)}</div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.paymentElementContainer}>
          <PaymentElement />
        </div>

        {error && <div style={styles.errorMessage}>{error}</div>}

        <div style={styles.buttonGroup}>
          <button
            type="button"
            style={styles.backButton}
            onClick={onBack}
            disabled={loading}
          >
            Back
          </button>
          <button
            type="submit"
            style={{
              ...styles.payButton,
              ...(loading || !stripe ? styles.disabledButton : {}),
            }}
            disabled={loading || !stripe}
          >
            {loading ? 'Processing...' : `Pay ${formatPrice(amount, currency)}`}
          </button>
        </div>

        <div style={styles.secureNote}>
          <svg style={styles.lockIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
          </svg>
          Secured by Stripe
        </div>
      </form>
    </div>
  );
}

// Cache stripe promise
let stripePromise: ReturnType<typeof loadStripe> | null = null;

function getStripe(publishableKey: string) {
  if (!stripePromise && publishableKey) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

interface PaymentFormWrapperProps extends PaymentFormProps {
  stripePublishableKey: string;
}

export function PaymentForm({
  clientSecret,
  amount,
  currency,
  onSuccess,
  onError,
  onBack,
  stripePublishableKey,
}: PaymentFormWrapperProps): JSX.Element {
  const stripe = getStripe(stripePublishableKey);

  if (!stripe || !clientSecret) {
    return (
      <div style={styles.container}>
        <div style={styles.errorMessage}>
          Payment system not configured. Please try again later.
        </div>
        <button type="button" style={styles.backButton} onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0066cc',
      },
    },
  };

  return (
    <Elements stripe={stripe} options={options}>
      <CheckoutFormInner
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
        onError={onError}
        onBack={onBack}
      />
    </Elements>
  );
}

export default PaymentForm;
