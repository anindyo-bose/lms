/**
 * Admin New Lesson Page - Create a new lesson for a course
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function AdminNewLessonPage() {
  const router = useRouter();
  const { id: courseId } = router.query;
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [order, setOrder] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`http://localhost:3008/api/lessons/${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          content,
          videoUrl,
          duration,
          order,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/admin/courses/${courseId}`);
      } else {
        setError(data.error || 'Failed to create lesson');
      }
    } catch (err) {
      setError('Failed to create lesson');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header style={{ padding: '20px 40px', background: '#ffffff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href={`/admin/courses/${courseId}`} style={{ color: '#6b7280', textDecoration: 'none' }}>← Back to Course</Link>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>New Lesson</h1>
        </div>
      </header>

      <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
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
                placeholder="Lesson title"
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief description of the lesson"
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="Lesson content (supports Markdown)"
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

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Order</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                min={1}
                style={{ width: '120px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
              />
              <small style={{ display: 'block', marginTop: '4px', color: '#6b7280' }}>Position in the course lesson list</small>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
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
                {saving ? 'Creating...' : 'Create Lesson'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/admin/courses/${courseId}`)}
                style={{
                  padding: '14px 24px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
