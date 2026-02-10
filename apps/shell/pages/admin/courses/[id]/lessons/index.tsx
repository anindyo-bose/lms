/**
 * Admin Lessons List Page - View all lessons for a course
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface Lesson {
  id: string;
  title: string;
  description: string;
  order: number;
  duration: number;
  published: boolean;
}

interface Course {
  id: string;
  title: string;
}

export default function AdminLessonsPage() {
  const router = useRouter();
  const { id: courseId } = router.query;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId) return;
    
    // Fetch course details
    fetch(`http://localhost:3008/api/courses/${courseId}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCourse(data.data);
        }
      })
      .catch(() => {});
    
    // Fetch lessons
    fetch(`http://localhost:3008/api/lessons/${courseId}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setLessons(data.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load lessons');
        setLoading(false);
      });
  }, [courseId]);

  const handleDelete = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const res = await fetch(`http://localhost:3008/api/lessons/${lessonId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setLessons(lessons.filter((l) => l.id !== lessonId));
      } else {
        alert(data.error || 'Failed to delete lesson');
      }
    } catch (err) {
      alert('Failed to delete lesson');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading lessons...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header style={{ padding: '20px 40px', background: '#ffffff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href={`/admin/courses/${courseId}`} style={{ color: '#6b7280', textDecoration: 'none' }}>← Back to Course</Link>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>
            Lessons {course ? `- ${course.title}` : ''}
          </h1>
        </div>
        <button
          onClick={() => router.push(`/admin/courses/${courseId}/lessons/new`)}
          style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
        >
          + Add Lesson
        </button>
      </header>

      <main style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        {error && (
          <div style={{ marginBottom: '20px', padding: '16px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        {lessons.length === 0 ? (
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 16px' }}>📝 No Lessons Yet</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>Create your first lesson for this course.</p>
            <button
              onClick={() => router.push(`/admin/courses/${courseId}/lessons/new`)}
              style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
            >
              Create Lesson
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lessons.sort((a, b) => a.order - b.order).map((lesson) => (
              <div
                key={lesson.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ 
                    width: '32px', 
                    height: '32px', 
                    background: '#e5e7eb', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 600,
                    color: '#374151',
                  }}>
                    {lesson.order}
                  </span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, color: '#111827' }}>{lesson.title}</h3>
                      <span
                        style={{
                          padding: '2px 8px',
                          background: lesson.published ? '#d1fae5' : '#fef3c7',
                          color: lesson.published ? '#059669' : '#d97706',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        {lesson.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
                      {lesson.duration ? `${lesson.duration} min` : 'No duration set'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => router.push(`/admin/courses/${courseId}/lessons/${lesson.id}`)}
                    style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(lesson.id)}
                    style={{ padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
