/**
 * Checkout Page - Dynamic route for course checkout
 */

import React, { Suspense } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Dynamically load checkout widget from Module Federation
const CheckoutWidget = dynamic(
  () => import('checkoutWidget/CheckoutWidget').then((mod) => mod.CheckoutWidget),
  {
    ssr: false,
    loading: () => <CheckoutLoading />,
  }
);

function CheckoutLoading() {
  return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner} />
      <p style={styles.loadingText}>Loading checkout...</p>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '40px 20px',
  },
  header: {
    maxWidth: '600px',
    margin: '0 auto 24px',
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
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
    marginTop: '16px',
    color: '#666',
    fontSize: '14px',
  },
};

export default function CheckoutPage() {
  const router = useRouter();
  const { courseId } = router.query;

  if (!courseId || typeof courseId !== 'string') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Invalid Checkout</h1>
          <p style={styles.subtitle}>No course selected for checkout.</p>
        </div>
      </div>
    );
  }

  const handleSuccess = (paymentIntentId: string) => {
    console.log('Payment successful:', paymentIntentId);
    // Redirect to course after success
    router.push(`/courses/${courseId}`);
  };

  const handleCancel = () => {
    router.back();
  };

  const handleError = (error: string) => {
    console.error('Checkout error:', error);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Complete Your Purchase</h1>
        <p style={styles.subtitle}>Secure checkout powered by Stripe</p>
      </div>
      
      <Suspense fallback={<CheckoutLoading />}>
        <CheckoutWidget
          courseId={courseId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          onError={handleError}
        />
      </Suspense>
    </div>
  );
}
