/**
 * Admin Analytics Page - View platform analytics
 */

import React from 'react';
import Link from 'next/link';

export default function AdminAnalyticsPage() {
  // Mock data for development
  const stats = {
    totalUsers: 156,
    newUsersThisMonth: 24,
    totalCourses: 12,
    totalEnrollments: 423,
    completionRate: 67,
    averageRating: 4.6,
    totalRevenue: 12450,
    revenueThisMonth: 2340,
  };

  const topCourses = [
    { title: 'Introduction to React', enrollments: 89, revenue: 4450 },
    { title: 'Advanced TypeScript', enrollments: 67, revenue: 5350 },
    { title: 'Node.js Backend Development', enrollments: 45, revenue: 2250 },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header style={{ padding: '20px 40px', background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none' }}>← Back</Link>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>Analytics</h1>
        </div>
      </header>

      <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Key Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 8px', color: '#6b7280', fontSize: '14px' }}>Total Users</p>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#111827' }}>{stats.totalUsers}</p>
            <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#10b981' }}>+{stats.newUsersThisMonth} this month</p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 8px', color: '#6b7280', fontSize: '14px' }}>Enrollments</p>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>{stats.totalEnrollments}</p>
            <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6b7280' }}>{stats.totalCourses} courses</p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 8px', color: '#6b7280', fontSize: '14px' }}>Completion Rate</p>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#8b5cf6' }}>{stats.completionRate}%</p>
            <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6b7280' }}>⭐ {stats.averageRating} avg rating</p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 8px', color: '#6b7280', fontSize: '14px' }}>Total Revenue</p>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>${(stats.totalRevenue / 100).toFixed(0)}</p>
            <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#10b981' }}>+${(stats.revenueThisMonth / 100).toFixed(0)} this month</p>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px', color: '#111827' }}>Enrollments Over Time</h3>
            <div style={{ height: '200px', background: '#f9fafb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              📈 Chart would render here with a charting library
            </div>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px', color: '#111827' }}>User Distribution</h3>
            <div style={{ height: '200px', background: '#f9fafb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              🥧 Pie chart would render here
            </div>
          </div>
        </div>

        {/* Top Courses */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#111827' }}>Top Performing Courses</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Course</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Enrollments</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topCourses.map((course, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', color: '#111827' }}>
                    <span style={{ marginRight: '8px' }}>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                    {course.title}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#6b7280' }}>{course.enrollments}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>${(course.revenue / 100).toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
