/**
 * Quiz Page - Take quiz for a lesson
 */

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Dynamically import the QuizWidget via Module Federation
const QuizWidget = dynamic(
  () =>
    import('quizWidget/QuizWidget').then((mod) => ({
      default: mod.QuizWidget,
    })),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading quiz...
      </div>
    ),
  }
);

export default function QuizPage() {
  const router = useRouter();
  const { id: quizId, lesson: lessonId, course: courseId } = router.query;

  const handleComplete = (result: { passed: boolean; score: number; percentage: number }) => {
    console.log('Quiz result:', result);
    if (result.passed && courseId && typeof courseId === 'string') {
      // Navigate back to course on success
      setTimeout(() => {
        router.push(`/courses/${courseId}`);
      }, 2000);
    }
  };

  const handleClose = () => {
    if (courseId && typeof courseId === 'string') {
      router.push(`/courses/${courseId}`);
    } else {
      router.push('/courses');
    }
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
            Quiz
          </span>
        </nav>
        <button
          onClick={handleClose}
          style={{
            padding: '0.5rem 1rem',
            background: '#ffffff',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Exit Quiz
        </button>
      </header>

      <main style={{ padding: '20px' }}>
        <Suspense
          fallback={
            <div style={{ padding: '40px', textAlign: 'center' }}>
              Loading quiz...
            </div>
          }
        >
          <QuizWidget
            quizId={typeof quizId === 'string' ? quizId : undefined}
            lessonId={typeof lessonId === 'string' ? lessonId : undefined}
            onComplete={handleComplete}
            onClose={handleClose}
          />
        </Suspense>
      </main>
    </div>
  );
}
