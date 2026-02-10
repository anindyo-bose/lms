/**
 * Dashboard Page - Protected route with quick actions
 */

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Dynamically import the CourseSummary component
const CourseSummary = dynamic(
  () =>
    import('progressWidget/CourseSummary').then((mod) => ({
      default: mod.CourseSummary,
    })),
  { ssr: false, loading: () => <div>Loading...</div> }
);

export default function DashboardPage() {
  const router = useRouter();

  // Placeholder data - in production, this would come from the useProgress hook
  const quickStats = [
    { label: 'Courses Enrolled', value: '3', icon: '📚' },
    { label: 'Lessons Completed', value: '12', icon: '✅' },
    { label: 'Current Streak', value: '5 days', icon: '🔥' },
    { label: 'Total Time', value: '8h 30m', icon: '⏱️' },
  ];

  const quickActions = [
    {
      title: 'Browse Courses',
      description: 'Explore new courses to learn',
      icon: '🎓',
      href: '/courses',
      color: '#3b82f6',
    },
    {
      title: 'My Progress',
      description: 'View your learning analytics',
      icon: '📊',
      href: '/progress',
      color: '#10b981',
    },
    {
      title: 'Continue Learning',
      description: 'Resume where you left off',
      icon: '▶️',
      href: '/courses',
      color: '#8b5cf6',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Header */}
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
          Dashboard
        </h1>
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/courses" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Courses
          </Link>
          <Link href="/progress" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Progress
          </Link>
          <Link href="/login" style={{ color: '#ef4444', textDecoration: 'none' }}>
            Logout
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', color: '#111827' }}>
            Welcome back! 👋
          </h2>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Continue your learning journey with Composey LMS
          </p>
        </div>

        {/* Quick Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '1.25rem',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h3 style={{ margin: '0 0 1rem', color: '#374151' }}>Quick Actions</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              style={{
                display: 'block',
                padding: '1.5rem',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                textDecoration: 'none',
                borderLeft: `4px solid ${action.color}`,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
                {action.icon}
              </div>
              <h4 style={{ margin: '0 0 0.25rem', color: '#111827' }}>
                {action.title}
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                {action.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Recent Activity Placeholder */}
        <h3 style={{ margin: '0 0 1rem', color: '#374151' }}>Recent Activity</h3>
        <div
          style={{
            padding: '2rem',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          <p style={{ margin: 0 }}>
            Start learning to see your activity here!
            <br />
            <Link href="/courses" style={{ color: '#3b82f6' }}>
              Browse courses →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
