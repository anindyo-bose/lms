/**
 * Admin Courses Page - Manage all platform courses
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface Course {
  id: string;
  title: string;
  description?: string;
  educatorId: string;
  price: number;
  published: boolean;
  level?: string;
  category?: string;
  createdAt: string;
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3008/api/courses', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        // API returns { success: true, data: [...] }
        setCourses(data.data || data.courses || []);
        setLoading(false);
      })
      .catch(() => {
        setCourses([]);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header style={{ padding: '20px 40px', background: '#ffffff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none' }}>← Back</Link>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>Manage Courses</h1>
        </div>
        <button
          onClick={() => router.push('/admin/courses/new')}
          style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
        >
          + Create Course
        </button>
      </header>

      <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {loading ? (
          <p>Loading courses...</p>
        ) : courses.length === 0 ? (
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 16px' }}>📚 No Courses Yet</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>Create your first course to get started.</p>
            <button
              onClick={() => router.push('/admin/courses/new')}
              style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
            >
              Create Course
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {courses.map((course) => (
              <div
                key={course.id}
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
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, color: '#111827' }}>{course.title}</h3>
                    <span
                      style={{
                        padding: '4px 8px',
                        background: course.published ? '#d1fae5' : '#fef3c7',
                        color: course.published ? '#059669' : '#d97706',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      {course.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    {course.category || 'General'} • {course.level || 'All levels'} • {course.price === 0 ? 'Free' : `$${(course.price / 100).toFixed(2)}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => router.push(`/admin/courses/${course.id}`)}
                    style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => router.push(`/admin/courses/${course.id}/lessons`)}
                    style={{ padding: '8px 16px', background: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Lessons
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
