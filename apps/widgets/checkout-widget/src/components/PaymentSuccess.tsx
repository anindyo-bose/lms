/**
 * Payment Success Component
 */

import React from 'react';
import type { PaymentSuccessProps } from '../types';

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    maxWidth: '480px',
    margin: '0 auto',
    textAlign: 'center' as const,
  },
  iconContainer: {
    width: '64px',
    height: '64px',
    backgroundColor: '#dcfce7',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  checkIcon: {
    width: '32px',
    height: '32px',
    color: '#16a34a',
  },
  header: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#16a34a',
    marginBottom: '8px',
  },
  subheader: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '24px',
  },
  courseCard: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  courseTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: '4px',
  },
  enrollmentMessage: {
    fontSize: '14px',
    color: '#666',
  },
  transactionId: {
    fontSize: '12px',
    color: '#999',
    marginTop: '8px',
    fontFamily: 'monospace',
  },
  continueButton: {
    width: '100%',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#0066cc',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export function PaymentSuccess({
  course,
  paymentIntentId,
  onContinue,
}: PaymentSuccessProps): JSX.Element {
  return (
    <div style={styles.container}>
      <div style={styles.iconContainer}>
        <svg style={styles.checkIcon} viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      </div>

      <h2 style={styles.header}>Payment Successful!</h2>
      <p style={styles.subheader}>Your purchase has been completed</p>

      <div style={styles.courseCard}>
        <div style={styles.courseTitle}>{course.title}</div>
        <div style={styles.enrollmentMessage}>
          You are now enrolled in this course
        </div>
        <div style={styles.transactionId}>
          Transaction ID: {paymentIntentId.slice(0, 20)}...
        </div>
      </div>

      <button style={styles.continueButton} onClick={onContinue} type="button">
        Start Learning
      </button>
    </div>
  );
}

export default PaymentSuccess;
