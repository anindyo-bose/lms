/**
 * Courses Page - Course listing and management
 */

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

// Dynamically import the CourseWidget via Module Federation
const CourseWidget = dynamic(
  () =>
    import('courseWidget/CourseWidget').then((mod) => ({
      default: mod.CourseWidget,
    })),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading courses...
      </div>
    ),
  }
);

export default function CoursesPage() {
  const router = useRouter();

  const handleCourseSelect = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const handleEnroll = (courseId: string) => {
    router.push(`/courses/${courseId}/lessons`);
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
          Courses
        </h1>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <a
            href="/dashboard"
            style={{ color: '#3b82f6', textDecoration: 'none' }}
          >
            Dashboard
          </a>
          <a
            href="/progress"
            style={{ color: '#3b82f6', textDecoration: 'none' }}
          >
            My Progress
          </a>
        </nav>
      </header>

      <main style={{ padding: '20px' }}>
        <Suspense
          fallback={
            <div style={{ padding: '40px', textAlign: 'center' }}>
              Loading...
            </div>
          }
        >
          <CourseWidget
            onCourseSelect={handleCourseSelect}
            onEnroll={handleEnroll}
          />
        </Suspense>
      </main>
    </div>
  );
}
