/**
 * Order Summary Component
 */

import React from 'react';
import type { OrderSummaryProps } from '../types';

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
  courseCard: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  thumbnail: {
    width: '80px',
    height: '60px',
    borderRadius: '4px',
    objectFit: 'cover' as const,
    backgroundColor: '#e0e0e0',
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: '4px',
  },
  instructor: {
    fontSize: '14px',
    color: '#666',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderTop: '1px solid #e0e0e0',
  },
  priceLabel: {
    fontSize: '16px',
    color: '#666',
  },
  priceValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1a1a1a',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  cancelButton: {
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
  proceedButton: {
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
};

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount / 100); // Amount is in cents
}

export function OrderSummary({
  course,
  onProceed,
  onCancel,
  loading = false,
}: OrderSummaryProps): JSX.Element {
  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Order Summary</h2>

      <div style={styles.courseCard}>
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            style={styles.thumbnail}
          />
        ) : (
          <div style={styles.thumbnail} />
        )}
        <div style={styles.courseInfo}>
          <div style={styles.courseTitle}>{course.title}</div>
          <div style={styles.instructor}>by {course.instructor.name}</div>
        </div>
      </div>

      <div style={styles.priceRow}>
        <span style={styles.priceLabel}>Total</span>
        <span style={styles.priceValue}>
          {formatPrice(course.price, course.currency)}
        </span>
      </div>

      <div style={styles.buttonGroup}>
        <button
          style={styles.cancelButton}
          onClick={onCancel}
          type="button"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          style={{
            ...styles.proceedButton,
            ...(loading ? styles.disabledButton : {}),
          }}
          onClick={onProceed}
          type="button"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </button>
      </div>
    </div>
  );
}

export default OrderSummary;
