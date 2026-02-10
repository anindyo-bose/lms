/**
 * Create New Course Page
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    difficulty_level: 'beginner',
    price: 0,
    is_free: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3008/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          price: form.is_free ? 0 : form.price * 100, // Convert to cents
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/courses/${data.course?.id || ''}`);
      } else {
        alert('Failed to create course');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating course');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header style={{ padding: '20px 40px', background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin/courses" style={{ color: '#6b7280', textDecoration: 'none' }}>← Back</Link>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>Create New Course</h1>
        </div>
      </header>

      <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {/* Title */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>
                Course Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
                placeholder="e.g., Introduction to React"
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', resize: 'vertical' }}
                placeholder="Describe what students will learn..."
              />
            </div>

            {/* Category & Difficulty */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>
                  Category
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="e.g., Web Development"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>
                  Difficulty Level
                </label>
                <select
                  value={form.difficulty_level}
                  onChange={(e) => setForm({ ...form, difficulty_level: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', background: '#fff' }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_free}
                  onChange={(e) => setForm({ ...form, is_free: e.target.checked, price: e.target.checked ? 0 : form.price })}
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{ fontWeight: 500, color: '#374151' }}>This course is free</span>
              </label>

              {!form.is_free && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>
                    Price (USD)
                  </label>
                  <div style={{ position: 'relative', maxWidth: '200px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '12px 12px 12px 28px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => router.back()}
                style={{ padding: '12px 24px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: loading ? '#9ca3af' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                }}
              >
                {loading ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
