/**
 * Admin Course Edit Page - View and edit a specific course
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  imageUrl: string;
  published: boolean;
  educatorId: string;
  createdAt: string;
  updatedAt: string;
}

interface Lesson {
  id: string;
  title: string;
  order: number;
  duration: number;
  published: boolean;
}

export default function AdminCourseEditPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('beginner');
  const [price, setPrice] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    // Fetch course details
    fetch(`http://localhost:3008/api/courses/${id}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const c = data.data;
          setCourse(c);
          setTitle(c.title || '');
          setDescription(c.description || '');
          setCategory(c.category || '');
          setLevel(c.level || 'beginner');
          setPrice(c.price || 0);
          setImageUrl(c.imageUrl || '');
          setPublished(c.published || false);
        } else {
          setError('Course not found');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load course');
        setLoading(false);
      });
    
    // Fetch lessons
    fetch(`http://localhost:3008/api/lessons/${id}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setLessons(data.data);
        }
      })
      .catch(() => {
        // No lessons yet
        setLessons([]);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`http://localhost:3008/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          category,
          level,
          price,
          imageUrl,
          published,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Course updated successfully!');
        setCourse(data.course || data.data);
      } else {
        setError(data.error || 'Failed to update course');
      }
    } catch (err) {
      setError('Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:3008/api/courses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        router.push('/admin/courses');
      } else {
        setError(data.error || 'Failed to delete course');
      }
    } catch (err) {
      setError('Failed to delete course');
    }
  };

  const handlePublishToggle = async () => {
    const newPublished = !published;
    setPublished(newPublished);
    
    try {
      await fetch(`http://localhost:3008/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ published: newPublished }),
      });
      setSuccess(newPublished ? 'Course published!' : 'Course unpublished');
    } catch (err) {
      setError('Failed to update publish status');
      setPublished(!newPublished);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading course...</p>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: '#dc2626' }}>Error</h2>
        <p>{error}</p>
        <Link href="/admin/courses" style={{ color: '#3b82f6' }}>← Back to Courses</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header style={{ padding: '20px 40px', background: '#ffffff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin/courses" style={{ color: '#6b7280', textDecoration: 'none' }}>← Back</Link>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>Edit Course</h1>
          <span
            style={{
              padding: '4px 12px',
              background: published ? '#d1fae5' : '#fef3c7',
              color: published ? '#059669' : '#d97706',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {published ? 'Published' : 'Draft'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handlePublishToggle}
            style={{
              padding: '10px 20px',
              background: published ? '#fef3c7' : '#d1fae5',
              color: published ? '#d97706' : '#059669',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {published ? 'Unpublish' : 'Publish'}
          </button>
          <button
            onClick={handleDelete}
            style={{ padding: '10px 20px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
          >
            Delete
          </button>
        </div>
      </header>

      <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        {success && (
          <div style={{ marginBottom: '20px', padding: '16px', background: '#d1fae5', color: '#059669', borderRadius: '8px' }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ marginBottom: '20px', padding: '16px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Course Details Form */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: '1.25rem', color: '#111827' }}>Course Details</h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Price (cents)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                    min={0}
                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                  />
                  <small style={{ color: '#6b7280' }}>${(price / 100).toFixed(2)}</small>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Image URL</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: saving ? '#9ca3af' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Lessons Panel */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Lessons</h2>
              <button
                onClick={() => router.push(`/admin/courses/${id}/lessons/new`)}
                style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
              >
                + Add
              </button>
            </div>
            
            {lessons.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No lessons yet</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {lessons.map((lesson, index) => (
                  <li
                    key={lesson.id}
                    style={{
                      padding: '12px',
                      borderBottom: index < lessons.length - 1 ? '1px solid #e5e7eb' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span style={{ color: '#6b7280', marginRight: '8px' }}>{lesson.order}.</span>
                      <span style={{ color: '#111827' }}>{lesson.title}</span>
                    </div>
                    <Link
                      href={`/admin/courses/${id}/lessons/${lesson.id}`}
                      style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}
                    >
                      Edit
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>


      </main>
    </div>
  );
}
