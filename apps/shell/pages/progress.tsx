/**
 * Progress Page - User learning analytics and progress tracking
 */

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Dynamically import the ProgressWidget via Module Federation
const ProgressWidget = dynamic(
  () =>
    import('progressWidget/ProgressWidget').then((mod) => ({
      default: mod.ProgressWidget,
    })),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading progress...
      </div>
    ),
  }
);

export default function ProgressPage() {
  const router = useRouter();

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const handleRefresh = () => {
    console.log('Progress data refreshed');
  };

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

      <main>
        <Suspense
          fallback={
            <div style={{ padding: '40px', textAlign: 'center' }}>
              Loading...
            </div>
          }
        >
          <ProgressWidget
            onCourseClick={handleCourseClick}
            onRefresh={handleRefresh}
          />
        </Suspense>
      </main>
    </div>
  );
}
