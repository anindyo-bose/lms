/**
 * Admin Lesson Edit Page - Edit an existing lesson
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  duration: number;
  order: number;
  published: boolean;
}

export default function AdminLessonEditPage() {
  const router = useRouter();
  const { id: courseId, lessonId } = router.query;
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [order, setOrder] = useState(1);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    
    fetch(`http://localhost:3008/api/lessons/detail/${lessonId}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const l = data.data;
          setLesson(l);
          setTitle(l.title || '');
          setDescription(l.description || '');
          setContent(l.content || '');
          setVideoUrl(l.videoUrl || '');
          setDuration(l.duration || 0);
          setOrder(l.order || 1);
          setPublished(l.published || false);
        } else {
          setError('Lesson not found');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load lesson');
        setLoading(false);
      });
  }, [lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`http://localhost:3008/api/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          content,
          videoUrl,
          duration,
          order,
          published,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Lesson updated successfully!');
      } else {
        setError(data.error || 'Failed to update lesson');
      }
    } catch (err) {
      setError('Failed to update lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:3008/api/lessons/${lessonId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/admin/courses/${courseId}`);
      } else {
        setError(data.error || 'Failed to delete lesson');
      }
    } catch (err) {
      setError('Failed to delete lesson');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading lesson...</p>
      </div>
    );
  }

  if (error && !lesson) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: '#dc2626' }}>Error</h2>
        <p>{error}</p>
        <Link href={`/admin/courses/${courseId}`} style={{ color: '#3b82f6' }}>← Back to Course</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header style={{ padding: '20px 40px', background: '#ffffff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href={`/admin/courses/${courseId}`} style={{ color: '#6b7280', textDecoration: 'none' }}>← Back to Course</Link>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>Edit Lesson</h1>
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
        <button
          onClick={handleDelete}
          style={{ padding: '10px 20px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
        >
          Delete Lesson
        </button>
      </header>

      <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
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

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Title *</label>
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
                rows={3}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Video URL</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  min={0}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Order</label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                  min={1}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Status</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ color: '#374151' }}>Published</span>
                </label>
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
      </main>
    </div>
  );
}
