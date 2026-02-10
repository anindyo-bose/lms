/**
 * Admin Transactions Page - View payment history
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  courseTitle: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3009/payments/transactions', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data.transactions || []);
        setLoading(false);
      })
      .catch(() => {
        // Mock data for development
        setTransactions([
          { id: '1', userId: 'u1', userEmail: 'student1@example.com', courseTitle: 'Introduction to React', amount: 4999, status: 'completed', createdAt: '2026-02-08' },
          { id: '2', userId: 'u2', userEmail: 'student2@example.com', courseTitle: 'Advanced TypeScript', amount: 7999, status: 'completed', createdAt: '2026-02-07' },
          { id: '3', userId: 'u3', userEmail: 'student3@example.com', courseTitle: 'Introduction to React', amount: 4999, status: 'refunded', createdAt: '2026-02-05' },
        ]);
        setLoading(false);
      });
  }, []);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      completed: { bg: '#d1fae5', text: '#059669' },
      pending: { bg: '#fef3c7', text: '#d97706' },
      refunded: { bg: '#fee2e2', text: '#dc2626' },
      failed: { bg: '#f3f4f6', text: '#6b7280' },
    };
    const c = colors[status] || colors.pending;
    return (
      <span style={{ padding: '4px 8px', background: c.bg, color: c.text, borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
        {status.toUpperCase()}
      </span>
    );
  };

  const totalRevenue = transactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header style={{ padding: '20px 40px', background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none' }}>← Back</Link>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>Transactions</h1>
        </div>
      </header>

      <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 8px', color: '#6b7280', fontSize: '14px' }}>Total Revenue</p>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>${(totalRevenue / 100).toFixed(2)}</p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 8px', color: '#6b7280', fontSize: '14px' }}>Total Transactions</p>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#111827' }}>{transactions.length}</p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 8px', color: '#6b7280', fontSize: '14px' }}>Completed</p>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>{transactions.filter((t) => t.status === 'completed').length}</p>
          </div>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <p>Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 16px' }}>💳 No Transactions Yet</h2>
            <p style={{ color: '#6b7280' }}>Transactions will appear here when students purchase courses.</p>
          </div>
        ) : (
          <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Date</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>User</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Course</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Amount</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px', color: '#6b7280' }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '16px', color: '#111827' }}>{tx.userEmail}</td>
                    <td style={{ padding: '16px', color: '#111827' }}>{tx.courseTitle}</td>
                    <td style={{ padding: '16px', fontWeight: 600, color: '#111827' }}>${(tx.amount / 100).toFixed(2)}</td>
                    <td style={{ padding: '16px' }}>{getStatusBadge(tx.status)}</td>
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
