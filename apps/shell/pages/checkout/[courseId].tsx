/**
 * Checkout Page - Course purchase placeholder
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  price: number;
  description: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { courseId } = router.query;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (courseId && typeof courseId === 'string') {
      fetch(`http://localhost:3008/api/courses/${courseId}`, { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          setCourse(data.course || data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [courseId]);

  const handlePurchase = async () => {
    setProcessing(true);
    try {
      const res = await fetch('http://localhost:3009/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId,
          amount: course?.price || 0,
          currency: 'usd',
        }),
      });
      
      if (res.ok) {
        // Simulate successful payment for development
        setSuccess(true);
        setTimeout(() => {
          router.push(`/courses/${courseId}`);
        }, 2000);
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
    setProcessing(false);
  };

  if (!courseId || typeof courseId !== 'string') {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '40px 20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px' }}>
            Invalid Checkout
          </h1>
          <p style={{ color: '#666' }}>No course selected for checkout.</p>
          <Link
            href="/courses"
            style={{
              display: 'inline-block',
              marginTop: '24px',
              padding: '12px 24px',
              background: '#3b82f6',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '8px',
            }}
          >
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '40px 20px' }}>
        <div
          style={{
            maxWidth: '500px',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', marginBottom: '16px' }}>
            Purchase Successful!
          </h1>
          <p style={{ color: '#6b7280' }}>Redirecting to your course...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '40px 20px' }}>
      <header style={{ maxWidth: '600px', margin: '0 auto 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px' }}>
          Complete Your Purchase
        </h1>
        <p style={{ fontSize: '14px', color: '#666' }}>Secure checkout</p>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : (
        <div
          style={{
            maxWidth: '500px',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
          <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: '#111827' }}>
            {course?.title}
          </h2>
          <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px' }}>
            {course?.description?.slice(0, 150)}...
          </p>

          <div
            style={{
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#374151' }}>Total</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                ${((course?.price || 0) / 100).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handlePurchase}
            disabled={processing}
            style={{
              width: '100%',
              padding: '16px',
              background: processing ? '#9ca3af' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: processing ? 'not-allowed' : 'pointer',
            }}
          >
            {processing ? 'Processing...' : 'Complete Purchase'}
          </button>

          <button
            onClick={() => router.back()}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '12px',
              background: 'transparent',
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
