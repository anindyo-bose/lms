/**
 * Progress Page - User learning analytics and progress tracking
 */

import React from 'react';
import Link from 'next/link';

export default function ProgressPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header
        style={{
          padding: '20px 40px',
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>
          My Progress
        </h1>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link
            href="/dashboard"
            style={{ color: '#3b82f6', textDecoration: 'none' }}
          >
            Dashboard
          </Link>
          <Link
            href="/courses"
            style={{ color: '#3b82f6', textDecoration: 'none' }}
          >
            Courses
          </Link>
        </nav>
      </header>

      <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h2 style={{ margin: '0 0 16px' }}>📊 Progress Tracking</h2>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Enroll in courses to start tracking your progress!
          </p>
          <Link
            href="/courses"
            style={{
              display: 'inline-block',
              marginTop: '20px',
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            Browse Courses
          </Link>
        </div>
      </main>
    </div>
  );
}
