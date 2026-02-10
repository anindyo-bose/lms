/**
 * Admin Users Page - Manage all platform users
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, this would call an admin API endpoint
    fetch('http://localhost:3008/api/admin/users', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => {
        // Mock data for development
        setUsers([
          { id: '1', email: 'admin@composey.local', firstName: 'Super', lastName: 'Admin', role: 'super_admin', createdAt: '2026-01-01' },
          { id: '2', email: 'educator@example.com', firstName: 'John', lastName: 'Educator', role: 'educator', createdAt: '2026-01-15' },
          { id: '3', email: 'student@example.com', firstName: 'Jane', lastName: 'Student', role: 'student', createdAt: '2026-02-01' },
        ]);
        setLoading(false);
      });
  }, []);

  const getRoleBadge = (role: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      super_admin: { bg: '#fee2e2', text: '#dc2626' },
      admin: { bg: '#fef3c7', text: '#d97706' },
      educator: { bg: '#dbeafe', text: '#2563eb' },
      student: { bg: '#d1fae5', text: '#059669' },
    };
    const c = colors[role] || { bg: '#f3f4f6', text: '#374151' };
    return (
      <span style={{ padding: '4px 8px', background: c.bg, color: c.text, borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
        {role.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header style={{ padding: '20px 40px', background: '#ffffff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none' }}>← Back</Link>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>Manage Users</h1>
        </div>
        <button
          onClick={() => router.push('/admin/users/new')}
          style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
        >
          + Add User
        </button>
      </header>

      <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Name</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Email</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Role</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Joined</th>
                  <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px', color: '#111827' }}>{user.firstName} {user.lastName}</td>
                    <td style={{ padding: '16px', color: '#6b7280' }}>{user.email}</td>
                    <td style={{ padding: '16px' }}>{getRoleBadge(user.role)}</td>
                    <td style={{ padding: '16px', color: '#6b7280' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}>Edit</button>
                      <button style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
