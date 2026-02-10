/**
 * Admin Add User Page - Create new platform users
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function AdminAddUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('admin');

  useEffect(() => {
    // Get current user's role from auth
    fetch('http://localhost:3007/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.role) {
          setCurrentUserRole(data.user.role);
        }
      })
      .catch(() => {});
  }, []);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'student',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3008/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      // Redirect to users list on success
      router.push('/admin/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: 500,
    color: '#374151',
    fontSize: '14px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header style={{ padding: '20px 40px', background: '#ffffff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/admin/users" style={{ color: '#6b7280', textDecoration: 'none' }}>← Back</Link>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>Add New User</h1>
      </header>

      <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '32px' }}>
          {error && (
            <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  placeholder="John"
                />
              </div>
              <div>
                <label style={labelStyle}>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="user@example.com"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                style={inputStyle}
              >
                <option value="student">Student</option>
                <option value="educator">Educator</option>
                {currentUserRole === 'super_admin' && (
                  <>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </>
                )}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  style={inputStyle}
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label style={labelStyle}>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '24px' }}>
              * User will be required to change password on first login
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => router.push('/admin/users')}
                style={{
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: loading ? '#9ca3af' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                }}
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
