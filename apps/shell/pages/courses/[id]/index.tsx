/**
 * Course Detail Page - Lesson listing placeholder
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string;
}

interface Lesson {
  id: string;
  title: string;
  order_index: number;
  content_type: string;
}

export default function CourseDetailPage() {
  const router = useRouter();
  const { id: courseId } = router.query;
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (courseId && typeof courseId === 'string') {
      Promise.all([
        fetch(`http://localhost:3008/api/courses/${courseId}`, { credentials: 'include' })
          .then((res) => res.json()),
        fetch(`http://localhost:3008/api/courses/${courseId}/lessons`, { credentials: 'include' })
          .then((res) => res.json()),
      ])
        .then(([courseData, lessonsData]) => {
          setCourse(courseData.course || courseData);
          setLessons(lessonsData.lessons || []);
          if (lessonsData.lessons?.length > 0) {
            setActiveLesson(lessonsData.lessons[0]);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [courseId]);

  if (!courseId || typeof courseId !== 'string') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading course...
      </div>
    );
  }

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
            {course?.title || 'Course Content'}
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

      <main style={{ display: 'flex', height: 'calc(100vh - 49px)' }}>
        {/* Sidebar - Lesson List */}
        <aside
          style={{
            width: '300px',
            background: '#ffffff',
            borderRight: '1px solid #e5e7eb',
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#111827' }}>
              Lessons
            </h2>
            {loading ? (
              <p style={{ color: '#6b7280' }}>Loading...</p>
            ) : lessons.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No lessons available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      background: activeLesson?.id === lesson.id ? '#dbeafe' : 'transparent',
                      border: activeLesson?.id === lesson.id ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                      {index + 1}.
                    </span>{' '}
                    <span style={{ color: '#111827' }}>{lesson.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {activeLesson ? (
            <div
              style={{
                maxWidth: '800px',
                margin: '0 auto',
                background: '#ffffff',
                borderRadius: '12px',
                padding: '32px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <h1 style={{ margin: '0 0 24px', color: '#111827' }}>
                {activeLesson.title}
              </h1>
              <div
                style={{
                  padding: '40px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <p style={{ color: '#6b7280' }}>
                  Lesson content would load here.
                </p>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>
                  Content type: {activeLesson.content_type}
                </p>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  style={{
                    padding: '12px 24px',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Mark as Complete
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p style={{ color: '#6b7280' }}>Select a lesson to begin.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
