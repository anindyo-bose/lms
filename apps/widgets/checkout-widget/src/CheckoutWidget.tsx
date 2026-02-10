/**
 * Checkout Widget - Main Component
 */

import React, { useEffect } from 'react';
import { useCheckout } from './hooks/useCheckout';
import { OrderSummary, PaymentForm, PaymentSuccess } from './components';
import type { CheckoutWidgetProps } from './types';

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minHeight: '400px',
    padding: '24px',
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e0e0e0',
    borderTopColor: '#0066cc',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#666',
    fontSize: '14px',
  },
  errorContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    maxWidth: '480px',
    margin: '0 auto',
    textAlign: 'center' as const,
  },
  errorIcon: {
    width: '48px',
    height: '48px',
    color: '#dc2626',
    margin: '0 auto 16px',
  },
  errorTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#dc2626',
    marginBottom: '8px',
  },
  errorMessage: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px',
  },
  retryButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 500,
    color: '#ffffff',
    backgroundColor: '#0066cc',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginRight: '12px',
  },
  cancelButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 500,
    color: '#666',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

// CSS keyframes for spinner
const spinnerKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export function CheckoutWidget({
  courseId,
  onSuccess,
  onCancel,
  onError,
  config: userConfig,
}: CheckoutWidgetProps): JSX.Element {
  const {
    state,
    loadCourse,
    createPaymentIntent,
    completePayment,
    setStep,
    reset,
    config,
  } = useCheckout({
    config: userConfig,
    onSuccess,
    onError,
  });

  useEffect(() => {
    if (courseId) {
      loadCourse(courseId);
    }
  }, [courseId, loadCourse]);

  const handleProceedToPayment = async () => {
    if (state.course) {
      await createPaymentIntent(courseId, state.course.price);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    completePayment(paymentIntentId);
  };

  const handlePaymentError = (error: string) => {
    onError?.(error);
  };

  const handleContinue = () => {
    if (state.course) {
      // Navigate to course page
      window.location.href = `/courses/${state.course.id}/lessons`;
    }
  };

  const handleRetry = () => {
    reset();
    loadCourse(courseId);
  };

  const handleCancel = () => {
    reset();
    onCancel?.();
  };

  const renderContent = () => {
    switch (state.step) {
      case 'loading':
        return (
          <div style={styles.loadingContainer}>
            <style>{spinnerKeyframes}</style>
            <div style={styles.spinner} />
            <div style={styles.loadingText}>Loading checkout...</div>
          </div>
        );

      case 'summary':
        if (!state.course) return null;
        return (
          <OrderSummary
            course={state.course}
            onProceed={handleProceedToPayment}
            onCancel={handleCancel}
            loading={state.loading}
          />
        );

      case 'payment':
        if (!state.paymentIntent || !state.course) return null;
        return (
          <PaymentForm
            clientSecret={state.paymentIntent.clientSecret}
            amount={state.paymentIntent.amount}
            currency={state.paymentIntent.currency}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onBack={() => setStep('summary')}
            stripePublishableKey={config.stripePublishableKey}
          />
        );

      case 'processing':
        return (
          <div style={styles.loadingContainer}>
            <style>{spinnerKeyframes}</style>
            <div style={styles.spinner} />
            <div style={styles.loadingText}>Processing payment...</div>
          </div>
        );

      case 'success':
        if (!state.course || !state.paymentIntent) return null;
        return (
          <PaymentSuccess
            course={state.course}
            paymentIntentId={state.paymentIntent.id}
            onContinue={handleContinue}
          />
        );

      case 'error':
        return (
          <div style={styles.errorContainer}>
            <svg style={styles.errorIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <div style={styles.errorTitle}>Checkout Error</div>
            <div style={styles.errorMessage}>
              {state.error || 'An unexpected error occurred'}
            </div>
            <button style={styles.retryButton} onClick={handleRetry} type="button">
              Try Again
            </button>
            <button style={styles.cancelButton} onClick={handleCancel} type="button">
              Cancel
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return <div style={styles.container}>{renderContent()}</div>;
}

export default CheckoutWidget;
