/**
 * Courses Page - Course listing and management
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  is_free: boolean;
  difficulty_level: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3008/api/courses', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setCourses(data.data || data.courses || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
          <Link href="/dashboard" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Dashboard
          </Link>
          <Link href="/progress" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            My Progress
          </Link>
        </nav>
      </header>

      <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading courses...</div>
        ) : courses.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 16px' }}>📚 No Courses Yet</h2>
            <p style={{ color: '#6b7280' }}>
              Check back soon for new courses!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <h3 style={{ margin: '0 0 8px', color: '#111827' }}>{course.title}</h3>
                <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: '14px' }}>
                  {course.description?.slice(0, 100)}...
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>
                    {course.is_free ? 'Free' : `$${(course.price / 100).toFixed(2)}`}
                  </span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {course.difficulty_level}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
