/**
 * Course Detail Page - Single course view with lessons
 */

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Dynamically import the LessonViewer via Module Federation
const LessonViewer = dynamic(
  () =>
    import('lessonWidget/LessonViewer').then((mod) => ({
      default: mod.LessonViewer,
    })),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading lessons...
      </div>
    ),
  }
);

export default function CourseDetailPage() {
  const router = useRouter();
  const { id: courseId, lesson: lessonId } = router.query;

  if (!courseId || typeof courseId !== 'string') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading course...
      </div>
    );
  }

  const handleLessonComplete = (lessonId: string) => {
    console.log('Lesson completed:', lessonId);
    // Could trigger a toast or navigate to next lesson
  };

  const handleCourseComplete = (courseId: string) => {
    console.log('Course completed:', courseId);
    router.push('/progress');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header
        style={{
          padding: '12px 24px',
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link
            href="/courses"
            style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}
          >
            Courses
          </Link>
          <span style={{ color: '#d1d5db' }}>/</span>
          <span style={{ color: '#111827', fontSize: '0.875rem', fontWeight: 500 }}>
            Course Content
          </span>
        </nav>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            href="/dashboard"
            style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}
          >
            Dashboard
          </Link>
          <Link
            href="/progress"
            style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}
          >
            My Progress
          </Link>
        </div>
      </header>

      <main>
        <Suspense
          fallback={
            <div style={{ padding: '40px', textAlign: 'center' }}>
              Loading lessons...
            </div>
          }
        >
          <LessonViewer
            courseId={courseId}
            initialLessonId={typeof lessonId === 'string' ? lessonId : undefined}
            onLessonComplete={handleLessonComplete}
            onCourseComplete={handleCourseComplete}
          />
        </Suspense>
      </main>
    </div>
  );
}
